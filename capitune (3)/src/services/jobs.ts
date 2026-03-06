import { ALL_JOBS } from '@/data/mockData';

// Simulates a real API call with delay
export const fetchJobs = async () => {
  return new Promise<typeof ALL_JOBS>((resolve) => {
    setTimeout(() => {
      resolve(ALL_JOBS);
    }, 800); // 800ms delay to simulate network
  });
};
