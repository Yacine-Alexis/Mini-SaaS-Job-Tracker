import Stripe from "stripe";

// Use the API version that matches the installed stripe package types
// Check package.json for stripe version and use corresponding API version
const STRIPE_API_VERSION = "2024-06-20" as Stripe.LatestApiVersion;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}
