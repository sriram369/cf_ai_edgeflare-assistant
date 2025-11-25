import { SessionDO } from "../do/session.js";
import html from "../static/index.html";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Serve the Frontend (Root URL)
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // --- API ROUTES ---

    // 2. Create New Session
    if (url.pathname === '/api/session' && request.method === 'POST') {
      const id = crypto.randomUUID().slice(0, 8);
      const objId = env.DURABLE_NS.idFromName(id);
      const obj = env.DURABLE_NS.get(objId);

      // Initialize the DO storage
      await obj.fetch('https://do/init', { method: 'POST' });

      return new Response(JSON.stringify({ sessionId: id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Get Chat History
    if (url.pathname === '/api/chat' && request.method === 'GET') {
      const sid = url.searchParams.get('sid');
      if (!sid) return new Response('Missing session id', { status: 400 });

      const obj = env.DURABLE_NS.get(env.DURABLE_NS.idFromName(sid));
      return obj.fetch('https://do/get');
    }

    // 4. Process Chat Message
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { sessionId, message } = await request.json();
      if (!sessionId || !message)
        return new Response('Missing fields', { status: 400 });

      const obj = env.DURABLE_NS.get(env.DURABLE_NS.idFromName(sessionId));

      // A. Store User Message in DO
      await obj.fetch('https://do/add', {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content: message }),
        headers: { 'Content-Type': 'application/json' },
      });

      // B. Load Full History from DO
      const histResp = await obj.fetch('https://do/get');
      const history = await histResp.json();

      // C. Run AI Inference (Workers AI)
      let assistantReply = '';
      try {
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: buildMessagesForLLM(history),
        });
        assistantReply = aiResponse?.response || "No AI response.";
      } catch (err) {
        console.error("AI Error:", err);
        assistantReply = "I am having trouble connecting to the neural network right now.";
      }

      // D. Store Assistant Message in DO
      await obj.fetch('https://do/add', {
        method: 'POST',
        body: JSON.stringify({ role: 'assistant', content: assistantReply }),
        headers: { 'Content-Type': 'application/json' },
      });

      return new Response(JSON.stringify({ reply: assistantReply }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};

// --- HELPER FUNCTIONS ---

function buildMessagesForLLM(history) {
  return [
    {
      role: "system",
      content: `You are EdgeFlare AI, an intelligent assistant running on Cloudflare Workers.
      - specific traits: concise, technical, and helpful.
      - context: You are running on the Edge, so prioritize speed and brevity.
      - knowledge: If asked about Cloudflare, explain the benefits of low-latency edge computing.
      - safety: Do not answer harmful or illegal questions.`
    },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];
}

// Export Durable Object class so Cloudflare can find it
export { SessionDO };