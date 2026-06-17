# test-data-mocking-mcp

An MCP server that mocks payments, third-party API responses, and test data — so QA flows for donation/checkout/SIP/subscription pages never depend on a live Razorpay (or any other) gateway.

This is the first piece of the AI Test Orchestration platform (see the proposal doc) — it directly unblocks the post-payment pages (`/payment-success`, `/enrolment`, `/slot-booking`, `/thankyou`) that are currently gated behind a live gateway in the QA Agent.

## Tools exposed

| Tool | Purpose |
|---|---|
| `mock_payment` | Simulates a Razorpay-shaped success/failure/timeout response for upi, card, netbanking, wallet, sip, or subscription_renewal |
| `mock_api_response` | Simulates any HTTP response (status code, latency, body) from any endpoint |
| `generate_test_user` | Fake user: name, email, phone — tagged `is_test_data: true` |
| `generate_test_campaign` | Fake donation campaign with goal/raised amounts and category |
| `generate_test_donation` | Fake donation, optionally linked to a real `campaign_id` |
| `generate_test_order` | Fake order (SIP / subscription / one-time) |

## ⚠️ Signature verification — read this before wiring into a real backend

`mock_payment` returns a `razorpay_signature` field shaped like a real one, but it is **random bytes, not a real HMAC** — it cannot pass real Razorpay signature verification, because that requires your live merchant secret, which this server intentionally never touches.

This tool is built to unblock **UI/flow testing** of post-payment pages (does the success page render correctly, does the thank-you email trigger, does the enrolment flow advance) — not to bypass real signature checks in a production code path. If your backend's payment-verification endpoint enforces signature checks even in a test environment, add a test-mode bypass there that recognizes IDs prefixed `pay_test_` / `order_test_` and skips HMAC verification for those. That's a one-line check in your verification middleware, not something this MCP server can or should do for you.

## Run locally

```bash
npm install
npm start
# Health check: http://localhost:8787/health
# MCP endpoint:  http://localhost:8787/mcp
```

Quick manual test with curl:

```bash
curl -s -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Deploy to Railway

Same pattern as the Mixpanel monitor — push this repo, connect it as a new Railway service, no extra config needed beyond the default Node buildpack. Railway sets `PORT` automatically; `src/index.js` already reads `process.env.PORT`.

```bash
git init
git add .
git commit -m "Test Data Mocking MCP — payments, API, and entity mocks"
git remote add origin <your-new-repo-url>
git push -u origin main
```

Then in Railway: New Project → Deploy from GitHub repo → select this repo. No environment variables are required for v1 since nothing here touches real secrets.

## Wiring it into n8n

In an n8n workflow, use an HTTP Request node pointed at `https://<your-railway-url>/mcp` with the JSON-RPC body shown above, or use n8n's MCP Client node if you're on a version that has it — point it at the same URL. Either way, this server is stateless, so you don't need to manage sessions between calls; every request is self-contained.

## Wiring it into the QA Agent backend or any AI agent

Add it as an MCP server the same way Asana/ClickUp/Slack are configured — point at the deployed `/mcp` URL. Any agent (Suite Creation Agent, Execution Agent, or a one-off test script) can then call `mock_payment`, `generate_test_user`, etc. as ordinary tools.

## Project structure

```
test-data-mocking-mcp/
├── package.json
├── src/
│   ├── index.js        # Express app, stateless Streamable HTTP transport
│   ├── server.js        # MCP server + all 6 tool registrations
│   └── mocks/
│       ├── payment.js   # mock_payment logic
│       ├── api.js       # mock_api_response logic
│       └── testData.js  # generate_test_* logic
└── README.md
```

## What's next

Per the build sequence: Smart Suite Generator (#2), Structured RCA / Failure Analysis Agent (#3), then the DB schema migration (#4). This server doesn't need to change for those — it's a standalone, finished piece.
