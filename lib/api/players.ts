const fetchPlayerData = async (id: string) => {
  // Implement your single player fetch logic here
  const response = await fetch(`/api/players/${id}`);
  return response.json();
};

export const fetchPlayersData = async (playerIds: string[]) => {
  console.log('Fetching data for players:', playerIds);
  
  const results = await Promise.allSettled(playerIds.map(id => fetchPlayerData(id)));
  
  return results
  /* eslint-disable @typescript-eslint/no-explicit-any */

    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);
}; 