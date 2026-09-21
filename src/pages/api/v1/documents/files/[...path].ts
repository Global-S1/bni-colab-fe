import type { APIRoute } from 'astro';

const CANDIDATE_BACKENDS = [
  process.env.INTERNAL_BACKEND_URL,
  'http://colab-be-prod_bnitech_online:3002',
  'http://bni-colab-be:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3002',
].filter(Boolean) as string[];

export const ALL: APIRoute = async ({ params, request }) => {
  const filePath = params.path;
  if (!filePath) {
    return new Response(JSON.stringify({ message: 'Nombre de archivo requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Strip trailing slash if present
  const cleanPath = filePath.replace(/\/$/, '');

  let lastResponse: Response | null = null;

  for (const backend of CANDIDATE_BACKENDS) {
    try {
      const targetUrl = `${backend}/api/v1/documents/files/${encodeURIComponent(cleanPath).replace(/%2F/g, '/')}`;
      const forwardHeaders: Record<string, string> = {};
      const range = request.headers.get('range');
      if (range) forwardHeaders['range'] = range;

      const res = await fetch(targetUrl, {
        method: request.method || 'GET',
        headers: forwardHeaders,
      });

      if (res.ok) {
        const responseHeaders = new Headers();
        const contentType = res.headers.get('content-type');
        const contentLength = res.headers.get('content-length');
        const contentDisposition = res.headers.get('content-disposition');
        const cacheControl = res.headers.get('cache-control');

        if (contentType) responseHeaders.set('Content-Type', contentType);
        if (contentLength) responseHeaders.set('Content-Length', contentLength);
        if (contentDisposition) responseHeaders.set('Content-Disposition', contentDisposition);
        if (cacheControl) responseHeaders.set('Cache-Control', cacheControl);
        responseHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(res.body, {
          status: res.status,
          headers: responseHeaders,
        });
      }

      lastResponse = res;
    } catch {
      // Try next backend candidate
    }
  }

  if (lastResponse) {
    const errorBody = await lastResponse.text();
    return new Response(errorBody, {
      status: lastResponse.status,
      headers: {
        'Content-Type': lastResponse.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(
    JSON.stringify({ message: 'Archivo no encontrado', error: 'Not Found', statusCode: 404 }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    }
  );
};
