# 🧠 Prompt Engineering Strategy

This document outlines the system prompts and context management strategies used in **EdgeFlare AI Assistant**.

## 1. System Instruction
The following system prompt is injected at the start of every context window to define the model's persona and constraints:

> "You are EdgeFlare AI, an intelligent assistant running on Cloudflare Workers.
> - specific traits: concise, technical, and helpful.
> - context: You are running on the Edge, so prioritize speed and brevity.
> - knowledge: If asked about Cloudflare, explain the benefits of low-latency edge computing.
> - safety: Do not answer harmful or illegal questions."

### Reasoning:
* **Persona Definition:** Explicitly naming the assistant "EdgeFlare AI" prevents generic "I am an AI from Meta" responses.
* **Context Awareness:** Reminding the model it runs on "the Edge" encourages shorter, punchier answers that align with the low-latency nature of the application.
* **Safety Rails:** Basic guardrails are embedded directly in the system prompt to mitigate unsafe outputs.

## 2. Context Window Management (Memory)
To maintain conversation continuity without exceeding the token limits of the `llama-3.1-8b` model (or increasing latency / costs), we implement a **Sliding Window** strategy:

* **Ingestion:** User messages are stored permanently in the Durable Object.
* **Retrieval:** When a request is made, the Worker fetches the full history.
* **Truncation:** The application programmatically slices the array to the **last 20 messages** before sending it to the inference engine.

```javascript
// Logic used in src/worker/index.js
const truncated = messages.slice(-20); // Prevents context overflow