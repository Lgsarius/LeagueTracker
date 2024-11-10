export const batchRequests = async <T>(
  items: string[],
  batchSize: number,
  fetchFn: (ids: string[]) => Promise<T[]>
) => {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await fetchFn(batch);
    results.push(...batchResults);
  }
  return results;
}; 