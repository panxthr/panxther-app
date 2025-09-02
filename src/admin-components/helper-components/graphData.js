// Standalone data transformation function - Sessions data only
const GraphDataTransformation = async (timeframe = '24h', userId = 'user_12345', baseUrl = 'http://localhost:5000') => {
  // Transform API data to mock data format
  const transformApiToMockData = (apiResult, timeframe = '24h') => {
    if (!apiResult || !apiResult.success || !apiResult.data?.data) {
      return [];
    }

    const data = apiResult.data.data;
    const now = new Date();
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 24;
    
    // Create hourly buckets
    const hourlyData = {};
    
    // Initialize all hours with zero data
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = time.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      
      hourlyData[hourKey] = {
        time: time.toISOString(),
        hour: time.getHours(),
        visitors: 0,
        engagement: 0,
        sessions: [],
        refs: {
          visits: {},
          engagement: {}
        }
      };
    }

    // Process ONLY sessions data - ignore summaries completely
    if (data.sessions && Array.isArray(data.sessions)) {
      data.sessions.forEach(session => {
        const sessionTime = new Date(session.startTime * 1000);
        const hourKey = sessionTime.toISOString().slice(0, 13);
        
        if (hourlyData[hourKey]) {
          hourlyData[hourKey].visitors += 1;
          hourlyData[hourKey].engagement += session.engagementScore || 0;
          hourlyData[hourKey].sessions.push(session);
          
          // Process refs
          const ref = session.ref || 'unknown';
          if (!hourlyData[hourKey].refs.visits[ref]) {
            hourlyData[hourKey].refs.visits[ref] = 0;
            hourlyData[hourKey].refs.engagement[ref] = 0;
          }
          
          hourlyData[hourKey].refs.visits[ref] += 1;
          hourlyData[hourKey].refs.engagement[ref] += session.engagementScore || 0;
        }
      });
    }

    // REMOVED: Summary data processing - only using session data now

    // Convert to array and calculate averages
    const transformedData = Object.values(hourlyData).map(hourData => ({
      time: hourData.time,
      hour: hourData.hour,
      visitors: hourData.visitors,
      engagement: hourData.engagement,
      refs: {
        visits: hourData.refs.visits,
        engagement: Object.keys(hourData.refs.engagement).reduce((acc, ref) => {
          const visits = hourData.refs.visits[ref] || 1;
          acc[ref] = Math.round(hourData.refs.engagement[ref] / visits);
          return acc;
        }, {})
      },
      sessionCount: hourData.sessions.length,
      sessionDetails: hourData.sessions
    }));

    return transformedData.sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  // Make API call
  const makeApiCall = async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        endpoint: endpoint
      };
    } catch (error) {
      console.error(`❌ API Error:`, error);
      return {
        status: 'error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: endpoint
      };
    }
  };

  // Get the API data
  const endpoint = `${baseUrl}/api/admin/${userId}/analytics?timeframe=${timeframe}&includeSessions=true`;
  const apiResult = await makeApiCall(endpoint);
  
  if (apiResult && apiResult.success) {
    // Transform the data
    console.log('API Result:', apiResult);
    const transformedData = transformApiToMockData(apiResult, timeframe);
    console.log('Transformed Data:', transformedData);
    
    // Create the final result
    const result = {
      timeframe: timeframe,
      totalHours: transformedData.length,
      transformedData: transformedData,
      summary: {
        totalVisitors: transformedData.reduce((sum, item) => sum + item.visitors, 0),
        avgEngagement: transformedData.reduce((sum, item) => sum + item.engagement, 0) / transformedData.length || 0,
        totalSessions: transformedData.reduce((sum, item) => sum + item.sessionCount, 0),
        uniqueRefs: [...new Set(transformedData.flatMap(item => Object.keys(item.refs.visits)))],
        peakHour: transformedData.reduce((max, item) => item.visitors > max.visitors ? item : max, transformedData[0] || {}),
      },
      originalApiResult: apiResult
    };
    return result;
  } else {
    return null;
  }
};


const GetAnalyticsData = async (timeframe = '24h', userId = 'user_12345', baseUrl = 'http://localhost:5000') => {
  
  // Helper function to calculate percentage change
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  // Calculate proper time ranges for current and previous periods
  const getTimeRanges = (timeframe) => {
    const now = Date.now();
    let periodMs;

    switch (timeframe) {
      case '24h':
        periodMs = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        periodMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        periodMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        periodMs = 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        periodMs = 24 * 60 * 60 * 1000;
    }

    return {
      current: {
        start: Math.floor((now - periodMs) / 1000),
        end: Math.floor(now / 1000)
      },
      previous: {
        start: Math.floor((now - (2 * periodMs)) / 1000),
        end: Math.floor((now - periodMs) / 1000)
      }
    };
  };

  // Make API call with time filtering
  const makeApiCall = async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data: data.data || data,
        timestamp: new Date().toISOString(),
        endpoint: endpoint
      };
    } catch (error) {
      console.error(`❌ API Error:`, error);
      return {
        status: 'error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: endpoint
      };
    }
  };

  // Filter sessions by time range
  const filterSessionsByTimeRange = (sessions, startTime, endTime) => {
    if (!sessions || !Array.isArray(sessions)) return [];
    
    return sessions.filter(session => {
      const sessionTime = session.startTime || session.timestamp;
      return sessionTime >= startTime && sessionTime <= endTime;
    });
  };

  // Process API data to get totals for a specific time period
  const processApiData = (apiResult, startTime, endTime) => {
    if (!apiResult || !apiResult.data) {
      return { visitors: 0, engagement: 0, refs: {} };
    }

    const data = apiResult.data;
    let totalVisitors = 0;
    let totalEngagement = 0;
    const refs = {};

    // Filter sessions to the specific time range
    const filteredSessions = filterSessionsByTimeRange(data.sessions, startTime, endTime);

    // Process filtered sessions
    filteredSessions.forEach(session => {
      totalVisitors += 1;
      totalEngagement += session.engagementScore || 0;
      
      const ref = session.ref || 'unknown';
      if (!refs[ref]) {
        refs[ref] = { visits: 0, engagement: 0 };
      }
      refs[ref].visits += 1;
      refs[ref].engagement += session.engagementScore || 0;
    });

    return {
      visitors: totalVisitors,
      engagement: Math.round(totalEngagement),
      refs: refs
    };
  };

  // Get time ranges
  const timeRanges = getTimeRanges(timeframe);

  // Since your API doesn't support date range parameters yet, we'll get all data and filter it
  // You should modify your API to support startDate/endDate parameters for better performance
  const currentEndpoint = `${baseUrl}/api/admin/${userId}/analytics?timeframe=1y&includeSessions=true`; // Get more data to filter
  const apiResult = await makeApiCall(currentEndpoint);

  if (!apiResult?.success) {
    console.error('Failed to fetch analytics data');
    return null;
  }

  console.log('API Result:', apiResult);
  console.log('Time Ranges:', timeRanges);

  // Process current and previous period data
  const currentData = processApiData(apiResult, timeRanges.current.start, timeRanges.current.end);
  const previousData = processApiData(apiResult, timeRanges.previous.start, timeRanges.previous.end);

  console.log('Current Data:', currentData);
  console.log('Previous Data:', previousData);

  // Transform refs data to match the expected format
  const transformedRefs = {};
  const allRefs = new Set([...Object.keys(currentData.refs), ...Object.keys(previousData.refs)]);

  allRefs.forEach(ref => {
    const currentRefData = currentData.refs[ref] || { visits: 0, engagement: 0 };
    const previousRefData = previousData.refs[ref] || { visits: 0, engagement: 0 };

    transformedRefs[ref] = {
      current: currentRefData.visits,
      previous: previousRefData.visits,
      change: calculateChange(currentRefData.visits, previousRefData.visits)
    };
  });

  // Create the final analytics data structure
  const analyticsData = {
    [timeframe]: {
      visitors: {
        current: currentData.visitors,
        previous: previousData.visitors,
        change: calculateChange(currentData.visitors, previousData.visitors)
      },
      engagement: {
        current: currentData.engagement,
        previous: previousData.engagement,
        change: calculateChange(currentData.engagement, previousData.engagement)
      },
      refs: transformedRefs
    }
  };

  console.log('Final Analytics Data:', analyticsData);
  return analyticsData;
};

// Usage examples:
// const graphData = await GraphDataTransformation('24h');
// const analyticsData = await GetAnalyticsData('24h');

export { GraphDataTransformation, GetAnalyticsData };