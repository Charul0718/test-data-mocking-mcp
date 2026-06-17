import crypto from "node:crypto";

const FIRST_NAMES = ["Aarav", "Priya", "Rohan", "Ishita", "Kabir", "Ananya", "Vikram", "Sneha"];
const LAST_NAMES = ["Sharma", "Patel", "Iyer", "Khan", "Gupta", "Nair", "Reddy", "Singh"];
const CATEGORIES = ["Education", "Medical", "Animal Welfare", "Disaster Relief", "Sports", "Environment"];
const PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shortId() {
  return crypto.randomBytes(4).toString("hex");
}

/** Generates a fake but realistic test user, clearly tagged for easy cleanup. */
export function generateTestUser() {
  const id = shortId();
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  return {
    id: `user_test_${id}`,
    name: `${first} ${last}`,
    email: `qa.test.${id}@example.com`,
    phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    is_test_data: true,
    created_by: "test-data-mocking-mcp",
    created_at: new Date().toISOString(),
  };
}

/** Generates a fake donation campaign. */
export function generateTestCampaign() {
  const id = shortId();
  const goal = (Math.floor(Math.random() * 20) + 1) * 50000; // ₹50k–₹1M
  return {
    id: `campaign_test_${id}`,
    title: `QA Test Campaign — ${pick(CATEGORIES)} ${id}`,
    category: pick(CATEGORIES),
    goal_amount: goal,
    raised_amount: Math.floor(goal * Math.random() * 0.6),
    status: "active",
    is_test_data: true,
    created_by: "test-data-mocking-mcp",
    created_at: new Date().toISOString(),
  };
}

/** Generates a fake donation linked to a (real or generated) campaign. */
export function generateTestDonation(campaignId) {
  const id = shortId();
  return {
    id: `donation_test_${id}`,
    campaign_id: campaignId || `campaign_test_${shortId()}`,
    donor: generateTestUser(),
    amount: pick([50000, 100000, 250000, 500000]),
    payment_method: pick(PAYMENT_METHODS),
    status: "completed",
    is_test_data: true,
    created_by: "test-data-mocking-mcp",
    created_at: new Date().toISOString(),
  };
}

/** Generates a fake order (SIP setup, subscription, or general checkout). */
export function generateTestOrder() {
  const id = shortId();
  return {
    order_id: `order_test_${id}`,
    amount: pick([29900, 49900, 99900]),
    currency: "INR",
    type: pick(["sip", "subscription", "one_time"]),
    status: "created",
    is_test_data: true,
    created_by: "test-data-mocking-mcp",
    created_at: new Date().toISOString(),
  };
}
