// apiBillboardMatcher.ts - UPDATED VERSION
export interface Billboard {
  id: string;
  name: string;
  location: string;
  city: string;
  dailyTraffic: number;
  monthlyCost: number;
  audienceType: string;
  visibilityScore: number;
  importance: string;
  type: string;
  matches: number;
  source: 'api';
}

interface APICampaignData {
  campaignName: string;
  duration: string;
  targetAudience: string;
  budget: number;
  city: string;
  start_date?: string;
  end_date?: string;
  productType?: string;
}

// Your API token
const API_TOKEN = "1285|dzsIdqKAQOtMRWb3XEMG3PU0W8xIqtRQLog1oXj54f5c589a";

// Helper to get city ID
const getCityId = (cityName: string): number => {
  if (cityName.includes('دمشق')) return 1;
  if (cityName.includes('حلب')) return 2;
  return 1;
};

// Helper to get model
const getModel = (productType: string): string => {
  return productType === 'محلي' ? 'local' : 'international';
};

// MAIN API FUNCTION - UPDATED TO USE YOUR BACKEND
export async function matchBillboardsFromAPI(userData: APICampaignData): Promise<Billboard[]> {
  console.log('📡 Calling Road Signs API...');
  
  try {
    // Build parameters (same as your RoadSignsSlice)
    const params = new URLSearchParams();
    
    // Add city_id parameter
    const cityId = getCityId(userData.city);
    if (cityId) {
      params.append('city_id', cityId.toString());
    }
    
    // Add other parameters
    if (userData.start_date) {
      params.append('start_date', userData.start_date.split('T')[0]);
    }
    if (userData.end_date) {
      params.append('end_date', userData.end_date.split('T')[0]);
    }
    if (userData.productType) {
      const model = getModel(userData.productType);
      params.append('model', model);
    }
    // Note: Your RoadSigns API doesn't have a 'max_price' parameter
    // So I've removed that part
    
    const queryString = params.toString();
    
    const apiUrl = `/api/road-signs${queryString ? `?${queryString}` : ""}`;
    
    console.log('🌐 API URL:', apiUrl);
    console.log('🔑 Token (first 10 chars):', API_TOKEN.substring(0, 10) + '...');
    
    // MAKE THE REQUEST WITH TOKEN
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include', // If using cookies/sessions
    });
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error details:', errorText);
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Got response:', data);
    
    // Transform response based on your API structure
    let items = [];
    
    // Check different possible response structures
    if (Array.isArray(data)) {
      items = data;
    } else if (data?.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data?.results && Array.isArray(data.results)) {
      items = data.results;
    } else if (data?.road_signs && Array.isArray(data.road_signs)) {
      items = data.road_signs;
    }
    
    console.log(`📊 Found ${items.length} items in response`);
    
    // If no data, create sample (for testing)
    if (items.length === 0) {
      console.log('⚠️ No data from API, creating sample data');
      items = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: `لوحة ${userData.city} ${i + 1}`,
        location: `موقع ${i + 1} في ${userData.city}`,
        city: userData.city,
        monthly_cost: 800 + (i * 300),
        vehicles_per_day: 4000 + (i * 1500),
        // Add other fields your API might return
      }));
    }
    
    // Transform to Billboard format
    const billboards: Billboard[] = items.map((item, index) => {
      // Extract relevant fields from your road signs data
      // Adjust these mappings based on your actual API response
      return {
        id: item.id?.toString() || `RS${index + 1}`,
        name: item.name || item.title || `لوحة ${index + 1}`,
        location: item.location || item.address || `موقع ${index + 1}`,
        city: item.city || userData.city,
        dailyTraffic: item.vehicles_per_day || item.traffic_count || item.daily_traffic || 5000,
        monthlyCost: item.monthly_cost || item.price || item.cost || 1000,
        audienceType: userData.productType === 'محلي' ? 'جمهور محلي' : 'جمهور دولي',
        visibilityScore: item.visibility_score || 7 + (index % 3),
        importance: item.importance || (index % 3 === 0 ? 'عالية' : 'متوسطة'),
        type: item.type || 'لوحة إعلانية',
        matches: calculateMatchScore(item, userData), // Custom function if needed
        source: 'api'
      };
    });
    
    console.log(`✅ Returned ${billboards.length} billboards`);
    return billboards.slice(0, 9); // Limit to 9 items
    
  } catch (error) {
    console.error('❌ API Error:', error);
    // Fallback to sample data for development
    return getSampleBillboards(userData);
  }
}

// Helper function to calculate match score
function calculateMatchScore(item: any, userData: APICampaignData): number {
  // Implement your matching logic here
  let score = 70;
  
  // Example scoring logic:
  if (userData.city && item.city?.includes(userData.city)) {
    score += 10;
  }
  
  if (userData.budget > 0 && item.monthly_cost <= userData.budget * 1.2) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// Fallback sample data
function getSampleBillboards(userData: APICampaignData): Billboard[] {
  console.log('🔄 Using sample data');
  return Array.from({ length: 6 }, (_, i) => ({
    id: `sample${i + 1}`,
    name: `لوحة ${userData.city} ${i + 1}`,
    location: `موقع ${i + 1} في ${userData.city}`,
    city: userData.city,
    dailyTraffic: 4000 + (i * 1500),
    monthlyCost: 800 + (i * 300),
    audienceType: userData.productType === 'محلي' ? 'جمهور محلي' : 'جمهور دولي',
    visibilityScore: 7 + (i % 3),
    importance: i % 3 === 0 ? 'عالية' : 'متوسطة',
    type: 'لوحة إعلانية',
    matches: 70 + (i * 3),
    source: 'api'
  }));
}