// This is a serverless function for Stripe Checkout
// Deploy to Vercel, Netlify, or similar

const stripe = require('stripe')('sk_test_51Sy8VFRvbHGS1LHYbW2Z7RDPEBr75uaaUlH2wQpgVy4VuObvVk4zRRp23140q96SZoPKpRTIMaL5RS4NYEZuPUpE00odbRlwic');

// Price IDs - you need to create these in Stripe Dashboard
const PRICE_IDS = {
  pe_pro_monthly: 'price_XXX', // Replace with real price ID from Stripe
  pe_pro_yearly: 'price_XXX',
  pe_enterprise_monthly: 'price_XXX',
  pe_enterprise_yearly: 'price_XXX',
  company_pro_monthly: 'price_XXX',
  company_pro_yearly: 'price_XXX',
  company_enterprise_monthly: 'price_XXX',
  company_enterprise_yearly: 'price_XXX',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, interval, userId, userEmail, successUrl, cancelUrl } = req.body;
    
    const priceKey = `${planId}_${interval}`;
    const priceId = PRICE_IDS[priceKey];
    
    if (!priceId || priceId === 'price_XXX') {
      return res.status(400).json({ error: 'Price not configured. Create prices in Stripe Dashboard.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        userId,
        planId,
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
