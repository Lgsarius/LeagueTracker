const RIOT_API_KEY = process.env.RIOT_API_KEY;

export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  const headers = {
    'X-Riot-Token': RIOT_API_KEY as string,
    'Accept': 'application/json',
    ...options.headers,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.ok || response.status !== 429) return response;
      
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, (retryAfter ? parseInt(retryAfter) : 1) * 1000));
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('Max retries reached');
} 