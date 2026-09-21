import type { APIRoute } from 'astro';

const CANDIDATE_BACKENDS = [
  process.env.INTERNAL_BACKEND_URL,
  'http://colab-be-prod_bnitech_online:3002',
  'http://colab-be-prod.bnitech.online:3002',
  'http://bni-colab-be:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3002',
].filter(Boolean) as string[];

export const ALL: APIRoute = async ({ params, request }) => {
  const subPath = params.path;
  if (!subPath) {
    return new Response(JSON.stringify({ message: 'Ruta no especificada' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const queryString = url.search || '';

  const method = request.method;
  let body: any = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) {
      body = buffer;
    }
  }

  const forwardHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'content-length') {
      forwardHeaders[key] = value;
    }
  });

  let lastError: any = null;

  for (const backend of CANDIDATE_BACKENDS) {
    try {
      const targetUrl = `${backend}/${subPath}${queryString}`;
      const res = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body,
        // @ts-ignore
        duplex: 'half',
      });

      const responseHeaders = new Headers();
      res.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
      responseHeaders.set('Access-Control-Allow-Origin', '*');

      return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (err) {
      lastError = err;
    }
  }

  return new Response(
    JSON.stringify({
      message: 'Error de comunicación con el servicio backend interno',
      error: lastError?.message || 'Error de conexión',
      statusCode: 502,
    }),
    {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    }
  );
};
