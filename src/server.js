import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockPayment } from "./mocks/payment.js";
import { mockApiResponse } from "./mocks/api.js";
import {
  generateTestUser,
  generateTestCampaign,
  generateTestDonation,
  generateTestOrder,
} from "./mocks/testData.js";

function toolResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/**
 * Builds a fresh McpServer instance with every mocking tool registered.
 * Called once per request in stateless HTTP mode (see src/index.js).
 */
export function createMcpServer() {
  const server = new McpServer(
    { name: "test-data-mocking-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool(
    "mock_payment",
    {
      title: "Mock Payment",
      description:
        "Simulates a payment gateway response (UPI, card, net banking, wallet, SIP, or subscription renewal) without contacting a live provider. Returns a Razorpay-shaped success or error payload for use in UI/flow testing.",
      inputSchema: {
        method: z.enum(["upi", "card", "netbanking", "wallet", "sip", "subscription_renewal"]),
        outcome: z.enum(["success", "failure", "timeout"]),
        amount: z.number().int().positive().optional().describe("Amount in paise. Defaults to 50000 (₹500)."),
      },
    },
    async ({ method, outcome, amount }) => toolResult(mockPayment({ method, outcome, amount }))
  );

  server.registerTool(
    "mock_api_response",
    {
      title: "Mock API Response",
      description:
        "Simulates an HTTP response from any backend or third-party API endpoint — success, validation error, timeout, or 5xx — without calling the real endpoint.",
      inputSchema: {
        endpoint: z.string().describe("The endpoint path or name being simulated, e.g. /api/donations"),
        status: z.number().int().describe("HTTP status code to simulate, e.g. 200, 400, 500, 408"),
        latency_ms: z.number().int().nonnegative().optional().describe("Simulated response latency in milliseconds."),
      },
    },
    async ({ endpoint, status, latency_ms }) => toolResult(mockApiResponse({ endpoint, status, latency_ms }))
  );

  server.registerTool(
    "generate_test_user",
    {
      title: "Generate Test User",
      description: "Generates a fake but realistic test user (name, email, phone), clearly tagged with is_test_data:true for easy cleanup.",
      inputSchema: {},
    },
    async () => toolResult(generateTestUser())
  );

  server.registerTool(
    "generate_test_campaign",
    {
      title: "Generate Test Campaign",
      description: "Generates a fake donation campaign with a goal amount, category, and progress, tagged for easy cleanup.",
      inputSchema: {},
    },
    async () => toolResult(generateTestCampaign())
  );

  server.registerTool(
    "generate_test_donation",
    {
      title: "Generate Test Donation",
      description: "Generates a fake donation, optionally linked to an existing campaign_id, with a generated donor and payment method.",
      inputSchema: {
        campaign_id: z.string().optional().describe("Existing campaign ID to attach this donation to. If omitted, a new fake campaign ID is generated."),
      },
    },
    async ({ campaign_id }) => toolResult(generateTestDonation(campaign_id))
  );

  server.registerTool(
    "generate_test_order",
    {
      title: "Generate Test Order",
      description: "Generates a fake order (SIP setup, subscription, or one-time checkout) tagged for easy cleanup.",
      inputSchema: {},
    },
    async () => toolResult(generateTestOrder())
  );

  return server;
}
