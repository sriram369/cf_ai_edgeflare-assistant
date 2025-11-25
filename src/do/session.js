export class SessionDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // FIXED: Changed '/do/init' to '/init'
    if (url.pathname === '/init' && request.method === 'POST') {
      await this.state.storage.put('messages', []);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // FIXED: Changed '/do/get' to '/get'
    if (url.pathname === '/get' && request.method === 'GET') {
      const messages = (await this.state.storage.get('messages')) || [];
      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // FIXED: Changed '/do/add' to '/add'
    if (url.pathname === '/add' && request.method === 'POST') {
      const incoming = await request.json();
      const messages = (await this.state.storage.get('messages')) || [];

      messages.push(incoming);
      const truncated = messages.slice(-20);

      await this.state.storage.put('messages', truncated);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}