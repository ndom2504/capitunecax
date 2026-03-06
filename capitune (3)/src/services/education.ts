
export interface University {
  name: string;
  web_pages: string[];
  domains: string[];
  country: string;
  "state-province": string | null;
}

// Fallback data in case API fails or for hybrid augmentation
const MOCK_COORDS: Record<string, {lat: number, lng: number}> = {
  "Alberta": { lat: 53.9333, lng: -116.5765 },
  "British Columbia": { lat: 53.7267, lng: -127.6476 },
  "Manitoba": { lat: 53.7609, lng: -98.8139 },
  "New Brunswick": { lat: 46.5653, lng: -66.4619 },
  "Newfoundland and Labrador": { lat: 53.1355, lng: -57.6604 },
  "Nova Scotia": { lat: 44.6820, lng: -63.7443 },
  "Ontario": { lat: 51.2538, lng: -85.3232 },
  "Prince Edward Island": { lat: 46.5107, lng: -63.4168 },
  "Quebec": { lat: 52.9399, lng: -73.5491 },
  "Saskatchewan": { lat: 52.9399, lng: -106.4509 },
};

const CITIES = [
  { name: "Montréal", province: "Quebec", lat: 45.5017, lng: -73.5673 },
  { name: "Québec", province: "Quebec", lat: 46.8139, lng: -71.2080 },
  { name: "Toronto", province: "Ontario", lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver", province: "British Columbia", lat: 49.2827, lng: -123.1207 },
  { name: "Ottawa", province: "Ontario", lat: 45.4215, lng: -75.6972 },
  { name: "Calgary", province: "Alberta", lat: 51.0447, lng: -114.0719 },
  { name: "Edmonton", province: "Alberta", lat: 53.5461, lng: -113.4938 },
  { name: "Halifax", province: "Nova Scotia", lat: 44.6488, lng: -63.5752 },
  { name: "Winnipeg", province: "Manitoba", lat: 49.8951, lng: -97.1384 },
];

export const fetchUniversities = async () => {
  try {
    const response = await fetch('http://universities.hipolabs.com/search?country=Canada');
    if (!response.ok) throw new Error('Failed to fetch');
    const data: University[] = await response.json();
    
    // Transform and augment data to match our app's schema
    return data.map((uni, index) => {
      // Try to find a matching city or default to a random one for the map
      const city = CITIES.find(c => uni.name.includes(c.name)) || CITIES[Math.floor(Math.random() * CITIES.length)];
      
      return {
        id: index + 1000, // Avoid conflict with mock IDs
        name: uni.name,
        url: uni.web_pages[0],
        logo: `https://logo.clearbit.com/${uni.domains[0]}`,
        programDir: `${uni.web_pages[0]}admissions`,
        program: "Programmes Divers", // API doesn't give programs, generic fallback
        location: `${city.name}, ${uni["state-province"] || city.province}`,
        city: city.name,
        province: uni["state-province"] || city.province,
        tuition: "Variable",
        type: "Université",
        lat: city.lat + (Math.random() * 0.05 - 0.025), // Jitter for map
        lng: city.lng + (Math.random() * 0.05 - 0.025),
        img: "university",
        category: 'education' as const
      };
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    return [];
  }
};
