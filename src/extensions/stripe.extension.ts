import Stripe from "stripe";

export class StripeExtension {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async getOrCreateCustomer(
    id: string,
    name: string,
    email: string,
    stripe_customer_id?: string | null | undefined
  ): Promise<string> {
    if (stripe_customer_id) {
      return stripe_customer_id;
    }

    const customer = await this.stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        user_id: id,
      },
    });

    return customer.id;
  }

  /**
   * Get a Stripe customer by ID
   */
  async getCustomer(
    customerId: string
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return await this.stripe.customers.retrieve(customerId);
  }

  /**
   * Create a subscription with an optional trial period
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number,
    promotionCode?: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      discounts: [
        {
          promotion_code: promotionCode,
        },
      ],
    });

    return subscription;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId
    );

    return await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    });
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url!;
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return paymentMethods.data;
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );
      return (
        subscription.status === "active" || subscription.status === "trialing"
      );
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(
    signature: string,
    payload: Buffer
  ): Promise<Stripe.Event> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }
}
