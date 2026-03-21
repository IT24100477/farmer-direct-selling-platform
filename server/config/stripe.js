import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export default stripe;
