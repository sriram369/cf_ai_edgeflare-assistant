# EdgeFlare AI Assistant (cf_ai_edgeflare-assistant)

**EdgeFlare AI Assistant** is a minimal demo of a stateful AI chat assistant built for Cloudflare’s optional assignment. It demonstrates:

- Cloudflare Workers for request routing and logic
- Durable Objects for persistent, per-session memory
- Workers AI (Llama 3.3) integration (preferred) or fallback to an external LLM
- Pages-based chat UI

## Repo structure
cf_ai_edgeflare-assistant/
├─ src/
│ ├─ worker/
│ │ └─ index.js
│ └─ do/
│ └─ session.js
├─ static/
│ └─ index.html
├─ PROMPTS.md
├─ README.md
└─ package.json


## How to run (local / dev)
1. Install Wrangler (Cloudflare CLI) — https://developers.cloudflare.com/workers/wrangler/
2. Login: `wrangler login`
3. Create `wrangler.toml` (example included below)
4. Start Pages dev server (if using Pages UI for frontend): `wrangler pages dev ./static`
5. Publish Worker: `wrangler publish`

## Deployment notes & bindings
In `wrangler.toml`, bind:
- Durable Object namespace `DURABLE_NS` to the session DO class
- (Optional) `WORKERS_AI` binding if your account has Workers AI
- (Fallback) `OPENAI_API_KEY` to call external LLM

### Example `wrangler.toml`
```toml
name = "cf_ai_edgeflare-assistant"
main = "src/worker/index.js"
compatibility_date = "2025-11-24"

[[durable_objects]]
bindings = [
  { name = "DURABLE_NS", class_name = "SessionDO" }
]

[bindings]
# Add any KV or secret bindings if used

[env.production]
# production-specific bindings (if needed)
