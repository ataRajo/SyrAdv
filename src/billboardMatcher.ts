export interface Billboard {
  id: string;
  location: string;
  city: string;
  dailyTraffic: number;
  name: string;
  monthlyCost: number;
  audienceType: string;
  visibilityScore: number;
  importance: string;
  type: string;
  matches: number;
}

interface UserCampaignData {
  campaignName: string;
  duration: string;
  targetAudience: string;
  budget: number;
  city: string;
}

async function parseYourCSVData(): Promise<Billboard[]> {
  console.log('📁 Loading YOUR data.csv with 34 columns...');
  
  try {
    const response = await fetch('/data.csv');
    const csvText = await response.text();
    
    // Remove any BOM characters and trim
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      console.error('❌ CSV has no data');
      return [];
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim());
    console.log(`📋 CSV has ${headers.length} columns:`, headers);
    
    // Map column indices based on YOUR CSV structure
    const columnMap = {
      id: headers.indexOf('id'),
      city: headers.indexOf('city'),
      place: headers.indexOf('place'),
      directions: headers.indexOf('directions'),
      vehicles_per_day: headers.indexOf('vehicles_per_day'),
      advertising_value: headers.indexOf('advertising_value'),
      target_audience: headers.indexOf('target_audience'),
      target_audience_text: headers.indexOf('target_audience_text'),
      importance_level: headers.indexOf('importance_level'),
      characteristics_text: headers.indexOf('characteristics_text'),
      location_type: headers.indexOf('location_type')
    };
    
    console.log('📍 Column mapping:', columnMap);
    
    // Parse data rows
    const billboards: Billboard[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        // Handle quoted CSV values with commas
        const values = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        
        // Extract data from YOUR CSV columns
        const getValue = (colIndex: number, defaultValue = '') => {
          return colIndex !== -1 && values[colIndex] !== undefined && values[colIndex] !== '' 
            ? values[colIndex] 
            : defaultValue;
        };
        
        // Get city and normalize it
        let city = getValue(columnMap.city, 'غير معروف');
        // Normalize city names
        if (city.includes('دمشق') || city.includes('دمش')) {
          city = 'دمشق';
        } else if (city.includes('حلب')) {
          city = 'حلب';
        }
        
        // Parse advertising value
        let monthlyCost = 1000;
        const advValueStr = getValue(columnMap.advertising_value);
        if (advValueStr && advValueStr.includes('قيمة_شهرية')) {
          try {
            // Try to extract from JSON-like structure
            const match = advValueStr.match(/'قيمة_شهرية':\s*(\d+(?:\.\d+)?)/);
            if (match) {
              monthlyCost = parseFloat(match[1]);
            } else {
              // Try direct number extraction
              const numMatch = advValueStr.match(/\d+/g);
              if (numMatch && numMatch.length > 0) {
                monthlyCost = parseFloat(numMatch[0]);
              }
            }
          } catch (e) {
            console.warn(`Could not parse advertising value: ${advValueStr}`);
          }
        }
        
        // Get audience type
        let audienceType = 'جمهور عام';
        const audienceText = getValue(columnMap.target_audience_text, 'جمهور عام');
        if (audienceText.includes('سائقون') || audienceText.includes('سائقين') || audienceText.includes('سائق')) {
          audienceType = 'سائقين';
        } else if (audienceText.includes('عائلات') || audienceText.includes('عائلة')) {
          audienceType = 'عائلات';
        } else if (audienceText.includes('شباب') || audienceText.includes('شاب')) {
          audienceType = 'شباب';
        } else if (audienceText.includes('رجال أعمال') || audienceText.includes('أعمال')) {
          audienceType = 'رجال أعمال';
        }
        
        // Get traffic data
        let dailyTraffic = 5000;
        const trafficStr = getValue(columnMap.vehicles_per_day, '5000');
        if (trafficStr) {
          const trafficMatch = trafficStr.match(/\d+/g);
          if (trafficMatch && trafficMatch.length > 0) {
            dailyTraffic = parseInt(trafficMatch[0]);
          }
        }
        
        // Get location
        const place = getValue(columnMap.place, 'موقع غير معروف');
        const directions = getValue(columnMap.directions, '');
        const location = directions ? `${place} - ${directions}` : place;
        
        // Get importance level
        const importance = getValue(columnMap.importance_level, 'متوسطة');
        
        // Get type
        const locationType = getValue(columnMap.location_type, 'لوحة إعلانية');
        const characteristics = getValue(columnMap.characteristics_text, 'لوحة إعلانية');
        let type = 'لوحة إعلانية';
        if (characteristics.includes('ثنائية') || characteristics.includes('مزدوجة')) {
          type = 'لوحة ثنائية';
        } else if (characteristics.includes('رقمية') || characteristics.includes('ديجيتال')) {
          type = 'شاشة رقمية';
        } else if (characteristics.includes('كهربائية') || characteristics.includes('إلكترونية')) {
          type = 'لوحة كهربائية';
        }
        
        // Calculate visibility score based on importance and traffic
        let visibilityScore = 7;
        if (importance.includes('قصوى') || importance.includes('عالية جداً')) visibilityScore = 10;
        else if (importance.includes('عالية')) visibilityScore = 8;
        else if (importance.includes('متوسطة')) visibilityScore = 6;
        else if (importance.includes('منخفضة')) visibilityScore = 4;
        
        // Adjust based on traffic
        if (dailyTraffic > 15000) visibilityScore = Math.min(10, visibilityScore + 2);
        else if (dailyTraffic > 8000) visibilityScore = Math.min(10, visibilityScore + 1);
        
        const billboard: Billboard = {
          id: getValue(columnMap.id, `BB${i.toString().padStart(3, '0')}`),
          name: `لوحة إعلانية ${getValue(columnMap.id, `BB${i.toString().padStart(3, '0')}`)}`,
          location: location.substring(0, 100), // Limit length
          city: city,
          dailyTraffic: dailyTraffic,
          monthlyCost: monthlyCost,
          audienceType: audienceType,
          visibilityScore: visibilityScore,
          importance: importance,
          type: type,
          matches: 0
        };
        
        billboards.push(billboard);
        
      } catch (error) {
        console.warn(`⚠️ Skipping row ${i}:`, error);
      }
    }
    
    console.log(`✅ Successfully parsed ${billboards.length} REAL billboards`);
    
    // Show statistics by city
    const cityStats: Record<string, number> = {};
    billboards.forEach(b => {
      cityStats[b.city] = (cityStats[b.city] || 0) + 1;
    });
    console.log('🏙️ Billboards by city:', cityStats);
    
    // Show sample
    if (billboards.length > 0) {
      console.log('📊 Sample of YOUR real data:');
      billboards.slice(0, 3).forEach((b, idx) => {
        console.log(`  ${idx + 1}. ${b.id} - ${b.city} - ${b.location.substring(0, 30)}... - $${b.monthlyCost} - ${b.dailyTraffic} cars/day`);
      });
    }
    
    return billboards;
    
  } catch (error) {
    console.error('❌ Error parsing CSV:', error);
    return [];
  }
}

// MAIN MATCHING FUNCTION FOR YOUR CSV - FIXED VERSION
export async function matchBillboards(userData: UserCampaignData): Promise<Billboard[]> {
  console.log('🎯 User searching with:', userData);
  
  // Load ALL data
  const allBillboards = await parseYourCSVData();
  
  if (allBillboards.length === 0) {
    console.log('❌ No data loaded');
    return getFallbackBillboards();
  }
  
  console.log(`📊 Total billboards in CSV: ${allBillboards.length}`);
  
  // Step 1: Normalize city input
  const userCity = userData.city ? userData.city.trim().toLowerCase() : '';
  let targetCity = '';
  
  // Map user input to correct city names
  if (userCity.includes('دمشق') || userCity.includes('دمش') || userCity === 'دم') {
    targetCity = 'دمشق';
  } else if (userCity.includes('حلب') || userCity === 'ح') {
    targetCity = 'حلب';
  }
  
  console.log(`📍 User input: "${userData.city}" → Target city: "${targetCity}"`);
  
  // Step 2: Filter by city (STRICT FILTERING)
  let filteredBillboards = allBillboards;
  
  if (targetCity) {
    filteredBillboards = allBillboards.filter(b => {
      // Check if billboard city matches target city
      if (!b.city) return false;
      const billboardCity = b.city.trim().toLowerCase();
      return billboardCity.includes(targetCity.toLowerCase());
    });
    
    console.log(`📍 Strict city filter for "${targetCity}": ${filteredBillboards.length} matches`);
    
    // If no matches in strict city, try partial matching
    if (filteredBillboards.length === 0 && userCity) {
      console.log('🔄 Trying partial city matching');
      filteredBillboards = allBillboards.filter(b => 
        b.city && b.city.toLowerCase().includes(userCity)
      );
    }
  }
  
  // If still no matches, use all billboards
  if (filteredBillboards.length === 0) {
    console.log('⚠️ No city matches found, showing all billboards');
    filteredBillboards = allBillboards;
  }
  
  // Step 3: Filter by budget
  let budgetFiltered = filteredBillboards;
  
  if (userData.budget > 0) {
    const minBudget = userData.budget * 0.7;  // 30% less than user budget
    const maxBudget = userData.budget * 1.5;  // 50% more than user budget
    
    budgetFiltered = filteredBillboards.filter(b => 
      b.monthlyCost >= minBudget && b.monthlyCost <= maxBudget
    );
    
    console.log(`💰 Budget filter: $${userData.budget} (${minBudget}-${maxBudget}): ${budgetFiltered.length} matches`);
    
    // If too few matches, relax budget constraints
    if (budgetFiltered.length < 5) {
      console.log('🔄 Relaxing budget constraints');
      const relaxedMinBudget = userData.budget * 0.5;  // 50% less
      const relaxedMaxBudget = userData.budget * 2.0;  // 100% more
      
      budgetFiltered = filteredBillboards.filter(b => 
        b.monthlyCost >= relaxedMinBudget && b.monthlyCost <= relaxedMaxBudget
      );
    }
  }
  
  // Step 4: Calculate match scores
  const scoredResults = budgetFiltered.map(billboard => {
    let score = 50; // Base score
    
    // City match (40 points)
    if (targetCity && billboard.city) {
      const billboardCity = billboard.city.trim().toLowerCase();
      if (billboardCity.includes(targetCity.toLowerCase())) {
        score += 40; // Exact city match
      } else if (userCity && billboardCity.includes(userCity)) {
        score += 30; // Partial match
      }
    }
    
    // Budget match (30 points) - closer is better
    if (userData.budget > 0) {
      const ratio = billboard.monthlyCost / userData.budget;
      
      if (ratio >= 0.9 && ratio <= 1.1) {
        score += 30; // Perfect match (±10%)
      } else if (ratio >= 0.7 && ratio <= 1.3) {
        score += 20; // Good match (±30%)
      } else if (ratio >= 0.5 && ratio <= 1.5) {
        score += 10; // Acceptable match (±50%)
      } else if (ratio >= 0.3 && ratio <= 2.0) {
        score += 5; // Within range (±100%)
      }
    }
    
    // Audience match (20 points)
    if (userData.targetAudience && billboard.audienceType) {
      const userAud = userData.targetAudience.toLowerCase();
      const billAud = billboard.audienceType.toLowerCase();
      
      if (userAud.includes('شباب') && billAud.includes('شباب')) {
        score += 20;
      } else if ((userAud.includes('رجال') || userAud.includes('أعمال')) && 
                 (billAud.includes('رجال') || billAud.includes('أعمال'))) {
        score += 20;
      } else if (userAud.includes('سائق') && billAud.includes('سائق')) {
        score += 20;
      } else if (userAud.includes('عائل') && billAud.includes('عائل')) {
        score += 20;
      } else if (billAud.includes('عام')) {
        score += 10; // General audience gets partial points
      }
    }
    
    // Quality bonus (up to 10 points)
    if (billboard.visibilityScore >= 9) score += 5;
    else if (billboard.visibilityScore >= 8) score += 3;
    else if (billboard.visibilityScore >= 7) score += 1;
    
    if (billboard.importance.includes('قصوى') || billboard.importance.includes('عالية جداً')) {
      score += 5;
    } else if (billboard.importance.includes('عالية')) {
      score += 3;
    }
    
    // Traffic bonus (up to 10 points)
    if (billboard.dailyTraffic > 20000) score += 10;
    else if (billboard.dailyTraffic > 10000) score += 7;
    else if (billboard.dailyTraffic > 5000) score += 4;
    else if (billboard.dailyTraffic > 2000) score += 2;
    
    // Ensure score between 50-100
    score = Math.max(50, Math.min(score, 100));
    
    return {
      ...billboard,
      matches: Math.round(score)
    };
  });
  
  // Step 5: Sort by match score and get TOP 12
  const finalResults = scoredResults
    .sort((a, b) => {
      // Primary sort: match score
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }
      
      // Secondary sort: importance
      const importanceScore = (importance: string) => {
        if (importance.includes('قصوى') || importance.includes('عالية جداً')) return 4;
        if (importance.includes('عالية')) return 3;
        if (importance.includes('متوسطة')) return 2;
        return 1;
      };
      
      // Tertiary sort: traffic (higher is better)
      return b.dailyTraffic - a.dailyTraffic;
    })
    .slice(0, 12); // GET 12 RESULTS INSTEAD OF 9
  
  console.log(`✅ Found ${finalResults.length} matching billboards (requested 12)`);
  
  // Log detailed results
  if (finalResults.length > 0) {
    console.log('🏆 Top matches:');
    finalResults.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.matches}% - ${b.city} - $${b.monthlyCost} - ${b.dailyTraffic.toLocaleString()} cars/day - ${b.location.substring(0, 40)}...`);
    });
  }
  
  return finalResults;
}

export async function loadCSVBillboards(): Promise<Billboard[]> {
  return await parseYourCSVData();
}
