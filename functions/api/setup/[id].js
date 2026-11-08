// Stores one streamer setup in Workers KV (binding name: SETUPS).
export async function onRequest({ request, env, params }) {
  const id = String(params.id || '');
  if (!/^[a-z0-9]{8,32}$/.test(id)) return new Response('bad id', { status: 400 });
  const H = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (request.method === 'GET') {
    const v = await env.SETUPS.get(id, 'json');
    return v ? new Response(JSON.stringify(v.data), { headers: H }) : new Response('not found', { status: 404 });
  }
  if (request.method === 'PUT') {
    const key = request.headers.get('x-edit-key') || '';
    if (key.length < 16) return new Response('missing key', { status: 401 });
    const body = await request.text();
    if (body.length > 15e6) return new Response('too big', { status: 413 });
    let data; try { data = JSON.parse(body); } catch { return new Response('bad json', { status: 400 }); }
    const old = await env.SETUPS.get(id, 'json');
    if (old && old.key !== key) return new Response('wrong key', { status: 403 });
    await env.SETUPS.put(id, JSON.stringify({ key, data }));
    return new Response('ok', { headers: H });
  }
  return new Response('method not allowed', { status: 405 });
}
