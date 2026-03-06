import { ALL_HOUSING } from '@/data/mockData';

// Simulates a real API call with delay
export const fetchHousing = async () => {
  return new Promise<typeof ALL_HOUSING>((resolve) => {
    setTimeout(() => {
      resolve(ALL_HOUSING);
    }, 800); // 800ms delay to simulate network
  });
};
