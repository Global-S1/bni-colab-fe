const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '/api-proxy/api/v1';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('bni_colab_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bni_colab_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bni_colab_token');
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la petición: ${response.statusText}`);
  }

  return response.json();
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
  location?: string;
  teamId: string;
  projectId?: string;
  createdById: string;
  createdAt: string;
}

/**
 * Resolves file URLs that might have been saved with a localhost fallback in the database.
 * Replaces http://localhost:3002/api/v1 with the actual production API base URL.
 */
export function resolveFileUrl(url?: string): string {
  if (!url) return '';
  let resolvedUrl = url
    .replace('http://localhost:3002/api/v1', API_BASE_URL)
    .replace('https://colab.bnitech.online/api/v1', API_BASE_URL);

  // Fix SSL certificate issue for S3 buckets with dots in their name
  // Converts: https://guest-files.bnitech.online.s3.amazonaws.com/...
  // To:       https://s3.amazonaws.com/guest-files.bnitech.online/...
  const s3Regex = /^https:\/\/([^/]+)\.s3\.amazonaws\.com\/(.+)$/;
  const match = resolvedUrl.match(s3Regex);
  if (match) {
    const bucketName = match[1];
    const path = match[2];
    if (bucketName.includes('.')) {
      resolvedUrl = `https://s3.amazonaws.com/${bucketName}/${path}`;
    }
  }

  return resolvedUrl;
}
