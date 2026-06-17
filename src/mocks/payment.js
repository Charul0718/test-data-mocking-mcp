import crypto from "node:crypto";

const METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  sip: "SIP",
  subscription_renewal: "Subscription Renewal",
};

const FAILURE_REASONS = {
  upi: { code: "BAD_REQUEST_ERROR", reason: "payment_failed", description: "UPI payment declined by the customer's bank." },
  card: { code: "GATEWAY_ERROR", reason: "card_declined", description: "The card was declined by the issuing bank." },
  netbanking: { code: "GATEWAY_ERROR", reason: "payment_failed", description: "Net banking session expired before authorization completed." },
  wallet: { code: "BAD_REQUEST_ERROR", reason: "insufficient_balance", description: "Wallet payment failed due to insufficient balance." },
  sip: { code: "GATEWAY_ERROR", reason: "mandate_failed", description: "SIP mandate registration failed at the bank." },
  subscription_renewal: { code: "GATEWAY_ERROR", reason: "auto_debit_failed", description: "Subscription auto-debit failed at renewal." },
};

function randomId(prefix) {
  return `${prefix}_test_${crypto.randomBytes(8).toString("hex")}`;
}

function fakeSignature() {
  // NOT a real HMAC — see README "Signature verification" section.
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Simulates a payment gateway response without contacting a live provider.
 * Mirrors the shape Razorpay returns to the client/webhook so downstream
 * UI flows (success pages, thank-you pages, enrolment pages) can be tested
 * without a live transaction.
 */
export function mockPayment({ method, outcome, amount }) {
  if (!METHOD_LABELS[method]) {
    throw new Error(`Unsupported payment method: ${method}`);
  }

  const orderId = randomId("order");
  const paymentId = randomId("pay");
  const baseAmount = typeof amount === "number" ? amount : 50000; // paise, defaults to ₹500

  if (outcome === "success") {
    return {
      status: "success",
      method,
      amount: baseAmount,
      currency: "INR",
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: fakeSignature(),
      created_at: new Date().toISOString(),
    };
  }

  if (outcome === "timeout") {
    return {
      status: "timeout",
      method,
      amount: baseAmount,
      currency: "INR",
      razorpay_order_id: orderId,
      error: {
        code: "GATEWAY_ERROR",
        description: `${METHOD_LABELS[method]} request timed out waiting for gateway response.`,
        source: "gateway",
        step: "payment_initiation",
        reason: "gateway_timeout",
        metadata: { order_id: orderId },
      },
    };
  }

  // outcome === "failure"
  const failure = FAILURE_REASONS[method];
  return {
    status: "failure",
    method,
    amount: baseAmount,
    currency: "INR",
    razorpay_order_id: orderId,
    error: {
      code: failure.code,
      description: failure.description,
      source: "customer",
      step: "payment_authentication",
      reason: failure.reason,
      metadata: { order_id: orderId, payment_id: paymentId },
    },
  };
}
