import { randomUUID } from "node:crypto";
import { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import { protect } from "../auth.js";
import { effectivePlan, hasPremiumValidity, person, userKey } from "../db.js";
import { fail } from "../validation.js";

const stripeId = (value) => (typeof value === "string" ? value : value?.id);

const toDate = (timestamp) => new Date(timestamp * 1000);

function amountInCurrency(amount, currency) {
  if (!currency) return 0;

  const decimals = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;

  return (amount ?? 0) / 10 ** decimals;
}

export function paymentRoutes({
  auth,
  config,
  stores,
  images,
  stripe = config.STRIPE_SECRET_KEY
    ? new Stripe(config.STRIPE_SECRET_KEY)
    : null,
}) {
  const router = Router();
  const { transactions, users, client } = stores;

  const vendor = protect(auth, config, stores, "vendor");

  const profileData = (user) => ({
    ...person(user, true),
    image: images.publicURL(user.image),
  });

  const eventNow = () => ({
    type: "wedplan.checkout-reconciliation",
    created: Math.floor(Date.now() / 1000),
  });

  function verifyCheckout(checkout, order) {
    if (
      !checkout ||
      checkout.livemode !== false ||
      checkout.id !== order.stripeSessionId ||
      checkout.mode !== "subscription" ||
      checkout.status !== "complete" ||
      checkout.payment_status !== "paid" ||
      checkout.client_reference_id !== order.vendorId ||
      checkout.metadata?.vendorId !== order.vendorId ||
      checkout.metadata?.orderId !== order._id ||
      !stripeId(checkout.subscription)
    ) {
      return false;
    }

    return true;
  }

  async function reconcileCheckout(order) {
    if (!stripe || !order?.stripeSessionId) {
      return false;
    }

    let checkout;
    let subscription;

    try {
      checkout = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

      if (!verifyCheckout(checkout, order)) {
        return false;
      }

      subscription = await stripe.subscriptions.retrieve(
        stripeId(checkout.subscription),
      );
    } catch (error) {
      throw fail(
        502,
        "Stripe payment verification is temporarily unavailable. Please try again.",
      );
    }

    if (
      subscription.livemode !== false ||
      subscription.id !== stripeId(checkout.subscription) ||
      subscription.metadata?.vendorId !== order.vendorId ||
      subscription.metadata?.orderId !== order._id
    ) {
      throw fail(
        403,
        "The Stripe subscription could not be verified for this account.",
      );
    }

    await syncSubscription(subscription, order, eventNow(), checkout);

    return true;
  }

  router.post("/payments/checkout", vendor, async (req, res) => {
    if (!stripe) {
      throw fail(503, "Stripe test checkout has not been configured.");
    }

    const vendorId = String(req.user._id);

    const currentAccount = await users.findOne({
      _id: req.user._id,
    });

    if (hasPremiumValidity(currentAccount)) {
      throw fail(
        409,
        "This account already has paid Premium time. Switch back to Premium without checkout.",
      );
    }

    const now = new Date();

    await transactions.updateMany(
      {
        vendorId,
        checkoutOpen: true,
        stripeSessionId: { $exists: false },
        expiresAt: { $lte: now },
      },
      {
        $set: {
          checkoutOpen: false,
          status: "expired",
        },
      },
    );

    let order;

    try {
      order = await transactions.findOneAndUpdate(
        {
          vendorId,
          checkoutOpen: true,
        },
        {
          $setOnInsert: {
            _id: randomUUID(),
            plan: "premium",
            stripePriceId: config.STRIPE_PRICE_ID,
            status: "pending",
            createdAt: now,
            expiresAt: new Date(now.getTime() + 3600000),
            email: req.user.email,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      order = await transactions.findOne({
        vendorId,
        checkoutOpen: true,
      });

      if (!order) {
        throw fail(409, "Checkout changed. Try again.");
      }
    }

    let checkout;

    try {
      checkout = order.stripeSessionId
        ? await stripe.checkout.sessions.retrieve(order.stripeSessionId)
        : await stripe.checkout.sessions.create(
            {
              mode: "subscription",

              line_items: [
                {
                  price: order.stripePriceId ?? config.STRIPE_PRICE_ID,
                  quantity: 1,
                },
              ],

              customer_email: order.email,

              client_reference_id: vendorId,

              metadata: {
                orderId: order._id,
                vendorId,
              },

              subscription_data: {
                metadata: {
                  vendorId,
                  orderId: order._id,
                },
              },

              expires_at: Math.floor(order.expiresAt.getTime() / 1000),

              success_url:
                config.FRONTEND_URL +
                "/payment/success?session_id={CHECKOUT_SESSION_ID}",

              cancel_url: config.FRONTEND_URL + "/payment/cancel",
            },
            {
              idempotencyKey: "wedplan-checkout-" + order._id,
            },
          );
    } catch (error) {
      if (
        [
          "StripeAuthenticationError",
          "StripePermissionError",
          "StripeInvalidRequestError",
        ].includes(error.type)
      ) {
        if (order.stripeSessionId) {
          throw fail(
            502,
            "Stripe could not check your existing checkout. Try again shortly.",
          );
        }

        await transactions.updateOne(
          {
            _id: order._id,
            status: "pending",
            stripeSessionId: {
              $exists: false,
            },
          },
          {
            $set: {
              checkoutOpen: false,
              status: "failed",
            },
          },
        );

        throw fail(
          502,
          "Stripe rejected the checkout configuration. Check the test API key and recurring price.",
        );
      }

      throw error;
    }

    await transactions.updateOne(
      { _id: order._id },
      {
        $set: {
          stripeSessionId: checkout.id,
          currency: checkout.currency ?? "usd",
          amount: amountInCurrency(checkout.amount_total, checkout.currency),
        },
      },
    );

    order.stripeSessionId = checkout.id;

    if (checkout.status === "expired") {
      await transactions.updateOne(
        {
          _id: order._id,
          status: "pending",
        },
        {
          $set: {
            checkoutOpen: false,
            status: "expired",
          },
        },
      );

      throw fail(
        409,
        "This checkout expired. Select Upgrade to Premium again.",
      );
    }

    // Recover a completed checkout before rejecting
    // another upgrade request.
    if (checkout.status === "complete" && checkout.payment_status === "paid") {
      await reconcileCheckout(order);

      const updatedAccount = await users.findOne({
        _id: req.user._id,
      });

      if (hasPremiumValidity(updatedAccount)) {
        throw fail(
          409,
          "Payment already verified. Premium is active. Refresh your account.",
        );
      }

      throw fail(
        409,
        "Payment verified, but Premium activation is pending. Check payment status.",
      );
    }

    if (checkout.status !== "open" || !checkout.url) {
      throw fail(409, "A checkout is already being verified.");
    }

    res.json({ url: checkout.url });
  });

  router.get("/payments/plan", vendor, async (req, res) => {
    let price = null;
    let pricingUnavailable = false;

    if (stripe) {
      try {
        const item = await stripe.prices.retrieve(config.STRIPE_PRICE_ID);

        if (
          !item.active ||
          item.livemode ||
          item.type !== "recurring" ||
          !item.recurring ||
          item.unit_amount == null
        ) {
          throw Error("Invalid Premium price.");
        }

        price = {
          amount: amountInCurrency(item.unit_amount, item.currency),
          currency: item.currency,
          interval: item.recurring.interval,
          count: item.recurring.interval_count,
        };
      } catch {
        pricingUnavailable = true;
      }
    }

    const account = await users.findOne({
      _id: req.user._id,
    });

    res.set("Cache-Control", "no-store");

    res.json({
      profile: profileData(account),
      price,
      configured: Boolean(stripe),
      pricingUnavailable,
    });
  });

  router.patch("/payments/plan", vendor, async (req, res) => {
    const { action } = z
      .object({
        action: z.enum([
          "choose-free",
          "choose-premium",
          "end-renewal",
          "resume-renewal",
          "end-now",
        ]),
      })
      .strict()
      .parse(req.body);

    if (action === "choose-free" || action === "choose-premium") {
      const updated = await users.findOneAndUpdate(
        {
          _id: req.user._id,
          role: "vendor",
          isBlocked: { $ne: true },
          subscriptionPlan: "premium",
          subscriptionExpiresAt: {
            $gt: new Date(),
          },
        },
        {
          $set: {
            planPreference: action === "choose-free" ? "free" : "premium",
          },
        },
        {
          returnDocument: "after",
        },
      );

      if (!updated) {
        throw fail(
          409,
          "This account has no unexpired Premium period. Start a new checkout.",
        );
      }

      return res.json(profileData(updated));
    }

    if (!stripe) {
      throw fail(503, "Stripe billing is unavailable.");
    }

    const id = req.user.stripeSubscriptionId;

    if (!id || !hasPremiumValidity(req.user)) {
      throw fail(409, "There is no active Premium subscription to change.");
    }

    const vendorId = String(req.user._id);

    const order = await transactions.findOne({
      vendorId,
      stripeSubscriptionId: id,
      stripeInvoiceId: { $exists: false },
      status: "paid",
    });

    if (!order) {
      throw fail(409, "No verified payment was found for this subscription.");
    }

    let result;

    try {
      const current = await stripe.subscriptions.retrieve(id);

      if (
        current.livemode ||
        current.metadata?.vendorId !== vendorId ||
        current.metadata?.orderId !== order._id
      ) {
        throw fail(403, "This subscription could not be verified.");
      }

      if (current.status === "canceled") {
        result = current;
      } else if (action === "end-now") {
        result = await stripe.subscriptions.cancel(id, {
          invoice_now: false,
          prorate: false,
        });
      } else {
        result = await stripe.subscriptions.update(id, {
          cancel_at_period_end: action === "end-renewal",
          proration_behavior: "none",
        });
      }
    } catch (error) {
      if (error.status) throw error;

      throw fail(
        502,
        "Stripe could not update your subscription. Try again shortly.",
      );
    }

    await syncSubscription(result, order, {
      type: "wedplan.plan-change",
      created: Math.floor(Date.now() / 1000),
    });

    res.json(
      profileData(
        await users.findOne({
          _id: req.user._id,
        }),
      ),
    );
  });

  // Payment success page calls this endpoint.
  // It now reconciles a paid Stripe checkout if
  // the webhook has not completed activation.
  router.get("/payments/status", vendor, async (req, res) => {
    const id = req.query.session_id;

    if (typeof id !== "string" || !/^cs_test_[A-Za-z0-9_]{10,}$/.test(id)) {
      throw fail(400, "Enter a valid checkout reference.");
    }

    const vendorId = String(req.user._id);

    const order = await transactions.findOne({
      stripeSessionId: id,
      vendorId,
    });

    if (!order) {
      throw fail(404, "This checkout could not be found.");
    }

    let account = await users.findOne({
      _id: req.user._id,
    });

    // Reconcile when payment is not recorded
    // or the Premium period is not active.
    if (stripe && (order.status !== "paid" || !hasPremiumValidity(account))) {
      await reconcileCheckout(order);

      account = await users.findOne({
        _id: req.user._id,
      });
    }

    const updatedOrder = await transactions.findOne({
      _id: order._id,
    });

    res.set("Cache-Control", "no-store");

    res.json({
      status: updatedOrder.status,
      premiumActive: effectivePlan(account) === "premium",
    });
  });

  async function syncSubscription(
    subscription,
    order,
    event,
    checkout,
    invoice,
  ) {
    if (subscription.livemode !== false) {
      throw fail(400, "Only Stripe test subscriptions are accepted.");
    }

    if (
      subscription.metadata?.vendorId !== order.vendorId ||
      subscription.metadata?.orderId !== order._id
    ) {
      throw fail(403, "Subscription ownership could not be verified.");
    }

    const priceId = order.stripePriceId ?? config.STRIPE_PRICE_ID;

    const planItems = (subscription.items?.data ?? []).filter(
      (item) => item.price?.id === priceId,
    );

    if (!planItems.length) {
      throw fail(502, "The subscription does not match the Premium price.");
    }

    const period = Math.max(
      ...planItems.map(
        (item) =>
          item.current_period_end ?? subscription.current_period_end ?? 0,
      ),
    );

    if (!Number.isFinite(period) || period <= 0) {
      throw fail(
        502,
        "Could not verify the Stripe subscription billing period.",
      );
    }

    const active =
      subscription.status === "active" && period * 1000 > Date.now();

    const isPaid =
      event.type === "invoice.paid" || checkout?.payment_status === "paid";

    await client.withSession(async (session) => {
      await session.withTransaction(async () => {
        const account = await users.findOne(userKey(order.vendorId), {
          session,
        });

        if (
          !account ||
          account.role !== "vendor" ||
          account.isBlocked === true
        ) {
          return;
        }

        const currentOrder = await transactions.findOne(
          { _id: order._id },
          { session },
        );

        if (isPaid) {
          const payment = checkout
            ? {
                stripeSessionId: checkout.id,
                amount: amountInCurrency(
                  checkout.amount_total,
                  checkout.currency,
                ),
                currency: checkout.currency,
              }
            : {};

          await transactions.updateOne(
            { _id: order._id },
            {
              $set: {
                ...payment,
                checkoutOpen: false,
                status: "paid",
                stripeSubscriptionId: subscription.id,
              },
            },
            { session },
          );
        }

        if (invoice?.billing_reason === "subscription_cycle") {
          const invoiceId = "stripe-invoice-" + invoice.id;

          const previous = await transactions.findOne(
            { _id: invoiceId },
            { session },
          );

          if (previous?.status !== "paid") {
            const currency = invoice.currency;

            const amount = amountInCurrency(
              isPaid ? invoice.amount_paid : invoice.amount_due,
              currency,
            );

            await transactions.updateOne(
              { _id: invoiceId },
              {
                $set: {
                  status: isPaid ? "paid" : "failed",
                  amount,
                  currency,
                },
                $setOnInsert: {
                  vendorId: order.vendorId,
                  plan: "premium",
                  stripeSubscriptionId: subscription.id,
                  stripeInvoiceId: invoice.id,
                  createdAt: toDate(invoice.created),
                },
              },
              {
                upsert: true,
                session,
              },
            );
          }
        }

        const alreadyPaid = currentOrder?.status === "paid";

        const sameSubscription =
          account.stripeSubscriptionId === subscription.id;

        if (
          account.stripeSubscriptionId &&
          !sameSubscription &&
          new Date(account.subscriptionStartedAt).getTime() >=
            subscription.created * 1000
        ) {
          return;
        }

        // Reconciliation must not overwrite
        // a newer subscription event.
        const olderEvent =
          event.created <
          (sameSubscription ? (account.stripeEventTime ?? 0) : 0);

        if (olderEvent && subscription.status !== "canceled") {
          return;
        }

        if (!isPaid && !alreadyPaid && !sameSubscription) {
          return;
        }

        if (!active && !sameSubscription) {
          return;
        }

        await users.updateOne(
          { _id: account._id },
          {
            $set: {
              subscriptionPlan: active ? "premium" : "free",

              ...(!sameSubscription && isPaid && active
                ? { planPreference: "premium" }
                : {}),

              subscriptionExpiresAt: toDate(period),

              subscriptionStartedAt: toDate(subscription.created),

              stripeSubscriptionId: subscription.id,

              ...(event.type !== "wedplan.plan-change" &&
              event.type !== "wedplan.checkout-reconciliation"
                ? {
                    stripeEventTime: event.created,
                  }
                : {}),

              cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
            },
          },
          { session },
        );

        if (!active) {
          const activeListings = await stores.services
            .find(
              {
                vendorId: order.vendorId,
                status: "approved",
                active: true,
              },
              { session },
            )
            .sort({
              createdAt: 1,
              _id: 1,
            })
            .skip(3)
            .project({ _id: 1 })
            .toArray();

          await stores.services.updateMany(
            {
              _id: {
                $in: activeListings.map((listing) => listing._id),
              },
            },
            {
              $set: {
                active: false,
              },
            },
            { session },
          );
        }
      });
    });
  }

  async function webhook(req, res) {
    if (!stripe) {
      throw fail(503, "Stripe webhooks have not been configured.");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.get("stripe-signature"),
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw fail(400, "Invalid Stripe webhook signature.");
    }

    await processStripeEvent(event);

    res.sendStatus(200);
  }

  async function processStripeEvent(event) {
    if (event.livemode !== false) {
      throw fail(400, "Only Stripe test-mode events are accepted.");
    }

    const data = event.data.object;

    if (event.type.startsWith("checkout.session.")) {
      const order =
        data.metadata?.orderId &&
        (await transactions.findOne({
          _id: data.metadata.orderId,
          vendorId: data.client_reference_id,
        }));

      if (
        !order ||
        (order.stripeSessionId && order.stripeSessionId !== data.id)
      ) {
        return;
      }

      if (
        [
          "checkout.session.expired",
          "checkout.session.async_payment_failed",
        ].includes(event.type)
      ) {
        await transactions.updateOne(
          {
            _id: order._id,
            status: { $ne: "paid" },
          },
          {
            $set: {
              checkoutOpen: false,
              status: event.type.endsWith("expired") ? "expired" : "failed",
              stripeSessionId: data.id,
            },
          },
        );
      }

      if (
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type) &&
        data.payment_status === "paid" &&
        data.mode === "subscription"
      ) {
        const subscription = await stripe.subscriptions.retrieve(
          stripeId(data.subscription),
        );

        if (
          subscription.metadata?.orderId === order._id &&
          subscription.metadata?.vendorId === order.vendorId
        ) {
          await syncSubscription(subscription, order, event, data);
        }
      }
    } else if (
      [
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
      ].includes(event.type)
    ) {
      const subId = event.type.startsWith("customer.subscription.")
        ? data.id
        : stripeId(
            data.parent?.subscription_details?.subscription ??
              data.subscription,
          );

      if (subId) {
        const subscription =
          event.type === "customer.subscription.deleted"
            ? data
            : await stripe.subscriptions.retrieve(subId);

        const order =
          subscription.metadata?.orderId &&
          (await transactions.findOne({
            _id: subscription.metadata.orderId,
            vendorId: subscription.metadata.vendorId,
          }));

        if (order) {
          await syncSubscription(
            subscription,
            order,
            event,
            undefined,
            event.type.startsWith("invoice.") ? data : undefined,
          );
        }
      }
    }
  }

  return {
    router,
    webhook,
    processStripeEvent,
  };
}
