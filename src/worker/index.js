import { SessionDO } from "../do/session.js";
import html from "../static/index.html";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === '/api/session' && request.method === 'POST') {
      const id = crypto.randomUUID().slice(0, 8);
      const objId = env.DURABLE_NS.idFromName(id);
      const obj = env.DURABLE_NS.get(objId);

      // Note: We are sending to https://do/init, so pathname is /init
      await obj.fetch('https://do/init', { method: 'POST' });

      return new Response(JSON.stringify({ sessionId: id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/api/chat' && request.method === 'GET') {
      const sid = url.searchParams.get('sid');
      if (!sid) return new Response('Missing session id', { status: 400 });

      const obj = env.DURABLE_NS.get(env.DURABLE_NS.idFromName(sid));
      return obj.fetch('https://do/get');
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { sessionId, message } = await request.json();
      if (!sessionId || !message)
        return new Response('Missing fields', { status: 400 });

      const obj = env.DURABLE_NS.get(env.DURABLE_NS.idFromName(sessionId));

      // 1. Save User Message
      await obj.fetch('https://do/add', {
        method: 'POST',
        body: JSON.stringify({ role: 'user', content: message }),
        headers: { 'Content-Type': 'application/json' },
      });

      // 2. Get History
      const histResp = await obj.fetch('https://do/get');
      const history = await histResp.json();

      // 3. Run AI (FIXED MODEL NAME)
      let assistantReply = '';
      try {
        // Use 3.1-8b because 3.3-8b does not exist
        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: buildMessagesForLLM(history),
        });
        assistantReply = aiResponse?.response || "No AI response.";
      } catch (err) {
        console.error("AI Failed:", err);
        assistantReply = "I am having trouble thinking right now. (AI Error)";
      }

      // 4. Save Assistant Message
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

function buildMessagesForLLM(history) {
  return [
    { role: "system", content: "You are EdgeFlare AI Assistant. Keep responses clear and concise." },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];
}

export { SessionDO };