import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Helper function to make API requests
 * @param urlOrOptions URL string or options object
 * @param options Optional fetch options when first parameter is URL string
 * @returns Promise with JSON response data
 */
export async function apiRequest<T = any>(
  urlOrOptions: string | { url: string; method?: string; data?: any },
  options?: RequestInit
): Promise<T> {
  let url: string;
  let requestOptions: RequestInit = options || {};
  
  // Handle different parameter formats
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
  } else {
    url = urlOrOptions.url;
    requestOptions.method = urlOrOptions.method || 'GET';
    
    if (urlOrOptions.data) {
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...requestOptions.headers,
      };
      requestOptions.body = JSON.stringify(urlOrOptions.data);
    }
  }
  
  // Ensure credentials are included
  requestOptions.credentials = 'include';
  
  const response = await fetch(url, requestOptions);
  await throwIfResNotOk(response);
  return await response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
