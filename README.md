# 🚀 EdgeFlare AI Assistant

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare)
![Durable Objects](https://img.shields.io/badge/State-Durable%20Objects-blue?style=flat-square)
![Workers AI](https://img.shields.io/badge/AI-Llama%203.1-violet?style=flat-square)

**EdgeFlare AI Assistant** is a stateful, serverless chat application running entirely on Cloudflare's Edge. It demonstrates the power of combining **Workers** for compute, **Durable Objects** for low-latency storage, and **Workers AI** for inference.

This project was built as part of the Cloudflare Software Engineering Internship assignment.

🔗 **[Live Demo Available Here](https://cf_ai_edgeflare-assistant.thotasriramnaidu.workers.dev)**

---

## 🏗 System Architecture

The application implements a full-stack architecture optimized for the Edge:

1.  **Routing & Compute:** A Cloudflare Worker intercepts HTTP requests and serves the static frontend.
2.  **State Management (Memory):** A **Durable Object** (`SessionDO`) creates a unique storage instance for every user session. This allows the AI to "remember" the conversation history without needing an external database like Redis or Postgres.
3.  **Inference:** The Worker sends the chat history (retrieved from the DO) to **Workers AI**, running the `llama-3.1-8b-instruct` model.
4.  **Frontend:** A lightweight, client-side HTML interface served directly from the Worker for maximum speed.

---

## 📂 Project Structure

```text
cf_ai_edgeflare-assistant/
├── src/
│   ├── worker/
│   │   └── index.js      # Main Worker logic (Router & AI Orchestrator)
│   └── do/
│       └── session.js    # Durable Object class (State & Storage)
├── static/
│   └── index.html        # Chat UI (served via Worker)
├── PROMPTS.md            # AI System Prompts & Logic
├── package.json          # Dependencies
└── wrangler.toml         # Cloudflare Configuration

⚡ How to Run Locally
Clone the repository:



git clone [https://github.com/sriram369/cf_ai_edgeflare-assistant.git](https://github.com/sriram369/cf_ai_edgeflare-assistant.git)
cd cf_ai_edgeflare-assistant
Install dependencies:

Bash

npm install
Start the local development server:



npx wrangler dev
Deploy to Cloudflare:



npx wrangler deploy
🛠 Configuration
This project uses wrangler.toml for bindings:

DURABLE_NS: Binds to the SessionDO class for persistent storage.

AI: Binds to Cloudflare Workers AI platform.

🧠 AI & Prompt Engineering
See PROMPTS.md for detailed documentation on the system prompts used to guide the Llama model and how context windows are managed within the Durable Object.

