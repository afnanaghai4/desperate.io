const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMessage = `API request failed: ${res.statusText}`;
    
    try {
      const errorData = await res.json();
      // Try to extract error message from backend response
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If response is not JSON, use statusText
    }
    
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error("Failed to fetch backend health status");
  }

  return res.json();
}