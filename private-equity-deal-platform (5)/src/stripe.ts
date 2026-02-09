import { loadStripe, Stripe } from '@stripe/stripe-js';

// =============================================================================
// STRIPE CONFIGURATION
// =============================================================================

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sy8VFRvbHGS1LHY1m4qvODyV8p7UHETbITNJOdiLuljMNsUgZlEcnSwVpLXFlP9EtP9TSyl2kZKOjZqndVvCW1r00o6QoW8QW';

// Webhook signing secret - used on the server side to verify webhook authenticity
// This is included here for reference - in production, store this only on your server
export const STRIPE_WEBHOOK_SECRET = 'whsec_Wi5bim8RoUj7npUaFVVhsJnevQq8wHel';

// =============================================================================
// STRIPE PAYMENT LINKS
// =============================================================================
// Create Payment Links in your Stripe Dashboard:
// 1. Go to Stripe Dashboard > Payment Links > Create
// 2. Add a product for each plan
// 3. Set success URL to: https://your-domain.com/?payment=success&plan=PLAN_ID&tier=TIER
// 4. Set cancel URL to: https://your-domain.com/?payment=cancelled
// 5. Copy the Payment Link URL and paste below
// =============================================================================

// =============================================================================
// IMPORTANT: Create Payment Links in your Stripe Dashboard and paste URLs here
// 
// For each plan:
// 1. Go to Stripe Dashboard > Products > Create Product
// 2. Add the price (monthly and yearly)
// 3. Go to Payment Links > Create > Select the product
// 4. Set success URL: https://your-domain.com/?payment=success&plan=PLAN_ID&tier=TIER
// 5. Copy the generated payment link URL and paste below
// =============================================================================

export const PAYMENT_LINKS = {
  // PE Firm Plans - Replace with your actual Stripe Payment Link URLs
  // Example: 'https://buy.stripe.com/test_xxxxx'
  pe_pro_monthly: '',
  pe_pro_yearly: '',
  pe_enterprise_monthly: '',
  pe_enterprise_yearly: '',
  
  // Company Plans - Replace with your actual Stripe Payment Link URLs
  company_pro_monthly: '',
  company_pro_yearly: '',
  company_enterprise_monthly: '',
  company_enterprise_yearly: '',
};

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  yearlyPrice: number;
  interval: 'month' | 'year';
  features: string[];
  forRole: 'pe_firm' | 'company';
  paymentLinkMonthly?: string;
  paymentLinkYearly?: string;
}

// PE Firm Plans
export const PE_PLANS: SubscriptionPlan[] = [
  {
    id: 'pe_free',
    name: 'Starter',
    tier: 'free',
    price: 0,
    yearlyPrice: 0,
    interval: 'month',
    forRole: 'pe_firm',
    features: [
      'Browse all listings',
      'Send up to 5 inquiries/month',
      'Basic messaging',
      'Standard support',
    ],
  },
  {
    id: 'pe_pro',
    name: 'Professional',
    tier: 'pro',
    price: 299,
    yearlyPrice: 2870,
    interval: 'month',
    forRole: 'pe_firm',
    paymentLinkMonthly: PAYMENT_LINKS.pe_pro_monthly,
    paymentLinkYearly: PAYMENT_LINKS.pe_pro_yearly,
    features: [
      'Unlimited inquiries',
      'Verified firm badge ✓',
      'Priority in seller inquiries',
      'Advanced deal analytics',
      'Direct phone support',
      'Early access to new listings',
    ],
  },
  {
    id: 'pe_enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 999,
    yearlyPrice: 9590,
    interval: 'month',
    forRole: 'pe_firm',
    paymentLinkMonthly: PAYMENT_LINKS.pe_enterprise_monthly,
    paymentLinkYearly: PAYMENT_LINKS.pe_enterprise_yearly,
    features: [
      'Everything in Professional',
      'Exclusive off-market deals',
      'White-glove concierge service',
      'Custom deal sourcing',
      'Dedicated account manager',
      'Priority deal flow alerts',
      'API access',
    ],
  },
];

// Company/Seller Plans
export const COMPANY_PLANS: SubscriptionPlan[] = [
  {
    id: 'company_free',
    name: 'Basic',
    tier: 'free',
    price: 0,
    yearlyPrice: 0,
    interval: 'month',
    forRole: 'company',
    features: [
      '1 active listing',
      'Basic analytics',
      'Standard visibility',
      'Email support',
    ],
  },
  {
    id: 'company_pro',
    name: 'Growth',
    tier: 'pro',
    price: 199,
    yearlyPrice: 1910,
    interval: 'month',
    forRole: 'company',
    paymentLinkMonthly: PAYMENT_LINKS.company_pro_monthly,
    paymentLinkYearly: PAYMENT_LINKS.company_pro_yearly,
    features: [
      'Up to 3 active listings',
      'Featured listing badge ⭐',
      'Priority placement in search',
      'Advanced analytics dashboard',
      'Buyer insights & reports',
      'Priority support',
    ],
  },
  {
    id: 'company_enterprise',
    name: 'Premium',
    tier: 'enterprise',
    price: 499,
    yearlyPrice: 4790,
    interval: 'month',
    forRole: 'company',
    paymentLinkMonthly: PAYMENT_LINKS.company_enterprise_monthly,
    paymentLinkYearly: PAYMENT_LINKS.company_enterprise_yearly,
    features: [
      'Unlimited listings',
      'All listings featured ⭐⭐',
      'Top placement guarantee',
      'Dedicated M&A advisor',
      'Custom marketing materials',
      'Investor matching service',
      'White-glove support',
    ],
  },
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return [...PE_PLANS, ...COMPANY_PLANS].find(p => p.id === planId);
};

export const getPlansForRole = (role: 'pe_firm' | 'company'): SubscriptionPlan[] => {
  return role === 'pe_firm' ? PE_PLANS : COMPANY_PLANS;
};

// =============================================================================
// STRIPE CHECKOUT
// =============================================================================

// Create a checkout session and redirect to Stripe
export const createCheckoutSession = async (
  plan: SubscriptionPlan,
  billingInterval: 'month' | 'year',
  userEmail: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  const paymentLink = billingInterval === 'year' 
    ? plan.paymentLinkYearly 
    : plan.paymentLinkMonthly;

  // Check if payment links are configured
  if (!paymentLink || paymentLink === '') {
    // Demo mode - return success to simulate local upgrade
    console.log('Demo mode: No Stripe Payment Link configured. Simulating upgrade locally.');
    return { success: true };
  }

  try {
    // Build the checkout URL with prefilled email
    const checkoutUrl = new URL(paymentLink);
    checkoutUrl.searchParams.set('prefilled_email', userEmail);
    checkoutUrl.searchParams.set('client_reference_id', userId);
    
    console.log('Redirecting to Stripe Payment Link:', checkoutUrl.toString());
    
    // Redirect to Stripe
    window.location.href = checkoutUrl.toString();
    
    return { success: true };
  } catch (err) {
    console.error('Checkout error:', err);
    return { success: false, error: 'Failed to redirect to checkout' };
  }
};

// Check if Stripe is properly configured with real payment links
export const isStripeConfigured = (): boolean => {
  return Object.values(PAYMENT_LINKS).some(link => link && link.length > 0);
};

// =============================================================================
// WEBHOOK EVENTS TO SELECT IN STRIPE DASHBOARD
// =============================================================================
// 
// When setting up your webhook endpoint in Stripe Dashboard, select these events:
//
// 1. checkout.session.completed - When a customer completes payment
// 2. customer.subscription.created - When a new subscription is created
// 3. customer.subscription.updated - When a subscription is changed (upgrade/downgrade)
// 4. customer.subscription.deleted - When a subscription is cancelled
// 5. invoice.paid - When a recurring payment succeeds
// 6. invoice.payment_failed - When a recurring payment fails
//
// =============================================================================
// WEBHOOK HANDLER CODE (For your backend server)
// =============================================================================
// 
// const stripe = require('stripe')('sk_test_51Sy8VFRvbHGS1LHYbW2Z7RDPEBr75uaaUlH2wQpgVy4VuObvVk4zRRp23140q96SZoPKpRTIMaL5RS4NYEZuPUpE00odbRlwic');
// const endpointSecret = 'whsec_Wi5bim8RoUj7npUaFVVhsJnevQq8wHel';
//
// app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;
//
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.log('Webhook signature verification failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
//
//   switch (event.type) {
//     case 'checkout.session.completed':
//       const session = event.data.object;
//       // session.client_reference_id = userId you passed during checkout
//       // session.customer = Stripe customer ID (save this for future use)
//       // session.subscription = Stripe subscription ID
//       // Update user's subscription tier in your database
//       console.log('✅ Payment successful for user:', session.client_reference_id);
//       break;
//
//     case 'customer.subscription.updated':
//       const subscription = event.data.object;
//       // subscription.status = 'active', 'past_due', 'cancelled', etc.
//       // Update subscription status in your database
//       console.log('📝 Subscription updated:', subscription.id);
//       break;
//
//     case 'customer.subscription.deleted':
//       const deletedSub = event.data.object;
//       // Downgrade user to free tier in your database
//       console.log('❌ Subscription cancelled:', deletedSub.id);
//       break;
//
//     case 'invoice.payment_failed':
//       const invoice = event.data.object;
//       // Handle failed payment - send email notification, retry, etc.
//       console.log('⚠️ Payment failed for invoice:', invoice.id);
//       break;
//
//     case 'invoice.paid':
//       const paidInvoice = event.data.object;
//       // Confirm subscription is active
//       console.log('💰 Invoice paid:', paidInvoice.id);
//       break;
//   }
//
//   res.json({ received: true });
// });
// =============================================================================
