import React, { useState, useEffect } from 'react';

const DataController = (chartData, setChartData) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [userId, setUserId] = useState('user_12345');
  const [sessionId, setSessionId] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  
  const BASE_URL = 'http://localhost:5000';


  const makeApiCall = async (endpoint, label) => {
    try {
      console.log(`🚀 Making API call to: ${endpoint}`);
      const response = await fetch(endpoint);
      const data = await response.json();
      
      console.log(`✅ ${label} Response:`, data);
      
      const result = {
        status: response.status,
        success: response.ok,
        data: data,
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        label: label
      };
      
      setResults(prev => ({
        ...prev,
        [label]: result
      }));
      
      return data;
    } catch (error) {
      console.error(`❌ ${label} Error:`, error);
      const result = {
        status: 'error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        label: label
      };
      
      setResults(prev => ({
        ...prev,
        [label]: result
      }));
      return null;
    }
  };

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

    // Process sessions data
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

    // Process summary data to fill gaps
    if (data.summaries && Array.isArray(data.summaries)) {
      data.summaries.forEach(summary => {
        const summaryTime = new Date(summary.timestamp);
        const hourKey = summaryTime.toISOString().slice(0, 13);
        
        if (hourlyData[hourKey] && hourlyData[hourKey].visitors === 0) {
          // Use summary data if no session data exists for this hour
          hourlyData[hourKey].visitors = summary.totalSessions || 0;
          hourlyData[hourKey].engagement = summary.maxEngagementScore || 0;
        }
      });
    }

    // Convert to array and calculate averages
    const transformedData = Object.values(hourlyData).map(hourData => ({
      time: hourData.time,
      hour: hourData.hour,
      visitors: hourData.visitors,
      engagement: hourData.visitors > 0 ? Math.round(hourData.engagement / hourData.visitors) : 0,
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

  const testDataTransformation = async (timeframe = '24h') => {
    console.log(`🔄 Testing data transformation for ${timeframe}...`);
    
    // First get the API data
    const endpoint = `${BASE_URL}/api/admin/${userId}/analytics?timeframe=${timeframe}&includeSessions=true`;
    const result = await makeApiCall(endpoint, `Analytics for Transformation (${timeframe})`);
    
    if (result && results[`Analytics for Transformation (${timeframe})`]) {
      // Transform the data
      const transformedData = transformApiToMockData(results[`Analytics for Transformation (${timeframe})`], timeframe);
      
      // Store the transformed result
      const transformedResult = {
        status: 200,
        success: true,
        data: {
          timeframe: timeframe,
          totalHours: transformedData.length,
          transformedData: transformedData,
          summary: {
            totalVisitors: transformedData.reduce((sum, item) => sum + item.visitors, 0),
            avgEngagement: transformedData.reduce((sum, item) => sum + item.engagement, 0) / transformedData.length || 0,
            totalSessions: transformedData.reduce((sum, item) => sum + item.sessionCount, 0),
            uniqueRefs: [...new Set(transformedData.flatMap(item => Object.keys(item.refs.visits)))],
            peakHour: transformedData.reduce((max, item) => item.visitors > max.visitors ? item : max, transformedData[0] || {}),
          }
        },
        timestamp: new Date().toISOString(),
        endpoint: `Transformed: ${endpoint}`,
        label: `Transformed Mock Data (${timeframe})`
      };

      setResults(prev => ({
        ...prev,
        [`Transformed Mock Data (${timeframe})`]: transformedResult
      }));

      setChartData(transformedData.data);

      
      return transformedResult;
    }

    return null;
  };

  const testAllEndpoints = async () => {
    setLoading(true);

    try {
      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics?timeframe=30d&includeSessions=true`,
        'User Analytics (30 days)'
      );

      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics?timeframe=1h`,
        'User Analytics (1 hr)'
      );

      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics?timeframe=90d`,
        'User Analytics (90 days)'
      );

      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics/realtime`,
        'Real-time Analytics'
      );

      const interactionTypes = ['chatbotInteractions', 'blogViews', 'contactClicks', 'totalClicks'];
      for (const type of interactionTypes) {
        await makeApiCall(
          `${BASE_URL}/api/admin/${userId}/analytics/interactions/${type}?limit=10`,
          `${type} Analytics`
        );
      }

      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics/chatbot?timeframe=30d`,
        'Chatbot Analytics'
      );

      await makeApiCall(
        `${BASE_URL}/api/admin/${userId}/analytics/debug?limit=3`,
        'Debug Analytics Structure'
      );

      await makeApiCall(
        `${BASE_URL}/api/admin/stats`,
        'Server Statistics'
      );

      await makeApiCall(
        `${BASE_URL}/health`,
        'Health Check'
      );

    } catch (error) {
      console.error("❌ Error during API testing:", error);
    } finally {
      setLoading(false);
    }
  };

  const testSessionEndpoint = async () => {
    if (!sessionId.trim()) {
      alert("⚠️ Please enter a session ID first");
      return;
    }

    await makeApiCall(
      `${BASE_URL}/api/admin/${userId}/analytics/session/${sessionId}`,
      `Session Data (${sessionId})`
    );
  };

  // Test cleanup endpoint (be careful with this!)
  const testCleanupEndpoint = async () => {
    const oldTimestamp = Math.floor((Date.now() - (365 * 24 * 60 * 60 * 1000)) / 1000); // 1 year ago
    
    console.warn("⚠️ Testing cleanup endpoint (dry run with very old timestamp)");
    await makeApiCall(
      `${BASE_URL}/api/admin/${userId}/analytics/cleanup?beforeTimestamp=${oldTimestamp}&keepSummaries=true`,
      'Analytics Cleanup (Test)'
    );
  };

  // Auto-run basic tests on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      makeApiCall(`${BASE_URL}/health`, 'Initial Health Check');
      makeApiCall(`${BASE_URL}/api/admin/stats`, 'Initial Server Stats');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Format JSON for display
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // Get summary stats from result data
  const getSummaryStats = (result) => {
    if (!result.success || !result.data) return null;
    
    const data = result.data;
    const stats = [];
    
    if (data.data && data.data.summary) {
      const summary = data.data.summary;
      stats.push(`Sessions: ${summary.totalSessions || 0}`);
      stats.push(`Interactions: ${summary.totalInteractions || 0}`);
      stats.push(`Page Views: ${summary.pageViews || 0}`);
      stats.push(`Chatbot Sessions: ${summary.chatbotSessions || 0}`);
    } else if (data.transformedData) {
      // Handle transformed data stats
      stats.push(`Hours: ${data.totalHours || 0}`);
      stats.push(`Visitors: ${data.summary?.totalVisitors || 0}`);
      stats.push(`Avg Engagement: ${Math.round(data.summary?.avgEngagement || 0)}`);
    } else if (data.stats) {
      stats.push(`Total Users: ${data.stats.totalUsers || 0}`);
      stats.push(`Recent Users: ${data.stats.recentUsers || 0}`);
    } else if (data.status === 'OK') {
      stats.push('Server: Healthy');
      stats.push(`Port: ${data.port || 'N/A'}`);
    }
    
    return stats.length > 0 ? stats.join(' | ') : null;
  };

  return (
    <div></div>
    // <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
    //   <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    //     <h1 className="text-2xl font-bold text-gray-800 mb-4">
    //       Dashboard Data Controller
    //     </h1>
    //     <p className="text-gray-600 mb-4">
    //       Testing dashboard routes and displaying API responses with data transformation capabilities.
    //     </p>

    //     {/* Controls */}
    //     <div className="space-y-4 mb-6">
    //       <div className="flex flex-wrap gap-4">
    //         <div className="flex-1 min-w-64">
    //           <label className="block text-sm font-medium text-gray-700 mb-1">
    //             User ID
    //           </label>
    //           <input
    //             type="text"
    //             value={userId}
    //             onChange={(e) => setUserId(e.target.value)}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
    //             placeholder="Enter user ID"
    //           />
    //         </div>
    //         <div className="flex-1 min-w-64">
    //           <label className="block text-sm font-medium text-gray-700 mb-1">
    //             Session ID (optional)
    //           </label>
    //           <input
    //             type="text"
    //             value={sessionId}
    //             onChange={(e) => setSessionId(e.target.value)}
    //             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
    //             placeholder="Enter session ID"
    //           />
    //         </div>
    //       </div>
    //     </div>

    //     {/* Action Buttons */}
    //     <div className="flex flex-wrap gap-3 mb-6">
    //       <button
    //         onClick={testAllEndpoints}
    //         disabled={loading}
    //         className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //       >
    //         {loading ? 'Testing...' : 'Test All Endpoints'}
    //       </button>
          
    //       <button
    //         onClick={testSessionEndpoint}
    //         disabled={loading || !sessionId.trim()}
    //         className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //       >
    //         Test Session Endpoint
    //       </button>
          
    //       <button
    //         onClick={testCleanupEndpoint}
    //         disabled={loading}
    //         className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //       >
    //         Test Cleanup (Safe)
    //       </button>

    //       {/* Data Transformation Buttons */}
    //       <div className="flex gap-2">
    //         <button
    //           onClick={() => testDataTransformation('24h')}
    //           disabled={loading}
    //           className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //         >
    //           Transform 24h
    //         </button>
    //         <button
    //           onClick={() => testDataTransformation('7d')}
    //           disabled={loading}
    //           className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //         >
    //           Transform 7d
    //         </button>
    //         <button
    //           onClick={() => testDataTransformation('30d')}
    //           disabled={loading}
    //           className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //         >
    //           Transform 30d
    //         </button>
    //       </div>
          
    //       <button
    //         onClick={() => {
    //           setResults({});
    //           setSelectedResult(null);
    //           console.clear();
    //           console.log("🧹 Results cleared");
    //         }}
    //         disabled={loading}
    //         className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
    //       >
    //         Clear Results
    //       </button>
    //     </div>

    //     {/* Loading indicator */}
    //     {loading && (
    //       <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
    //         <div className="flex items-center">
    //           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
    //           <span className="text-blue-800">Running API tests...</span>
    //         </div>
    //       </div>
    //     )}
    //   </div>

    //   {/* Results Display */}
    //   {Object.keys(results).length > 0 && (
    //     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    //       {/* Results List */}
    //       <div className="bg-white rounded-lg shadow-lg p-6">
    //         <h2 className="text-lg font-semibold text-gray-800 mb-4">
    //           API Test Results ({Object.keys(results).length})
    //         </h2>
    //         <div className="space-y-2 max-h-96 overflow-y-auto">
    //           {Object.entries(results).map(([label, result]) => (
    //             <div
    //               key={label}
    //               onClick={() => setSelectedResult(result)}
    //               className={`cursor-pointer p-3 rounded border transition-all hover:shadow-md ${
    //                 result.success 
    //                   ? label.includes('Transformed') 
    //                     ? 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    //                     : 'bg-green-50 border-green-200 hover:bg-green-100'
    //                   : 'bg-red-50 border-red-200 hover:bg-red-100'
    //               } ${
    //                 selectedResult === result ? 'ring-2 ring-blue-500' : ''
    //               }`}
    //             >
    //               <div className="flex items-center justify-between mb-1">
    //                 <span className="font-medium text-sm">{label}</span>
    //                 <div className="flex items-center gap-2">
    //                   <span className="text-xs">
    //                     {label.includes('Transformed') ? '🔄' : result.success ? '✅' : '❌'}
    //                   </span>
    //                   <span className="text-xs font-mono bg-gray-100 px-1 rounded">
    //                     {typeof result.status === 'number' ? result.status : result.status}
    //                   </span>
    //                 </div>
    //               </div>
                  
    //               {/* Summary stats */}
    //               {getSummaryStats(result) && (
    //                 <div className="text-xs text-gray-600 mb-1">
    //                   {getSummaryStats(result)}
    //                 </div>
    //               )}
                  
    //               <div className="flex justify-between items-center text-xs text-gray-500">
    //                 <span className="truncate flex-1 mr-2">{result.endpoint}</span>
    //                 <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //       </div>

    //       {/* Detailed Data View */}
    //       <div className="bg-white rounded-lg shadow-lg p-6">
    //         <h2 className="text-lg font-semibold text-gray-800 mb-4">
    //           Data Details
    //         </h2>
    //         {selectedResult ? (
    //           <div className="space-y-4">
    //             <div className="bg-gray-50 p-3 rounded">
    //               <h3 className="font-medium text-gray-700 mb-2">{selectedResult.label}</h3>
    //               <div className="text-sm text-gray-600">
    //                 <div>Status: <span className={selectedResult.success ? 'text-green-600' : 'text-red-600'}>
    //                   {selectedResult.status}
    //                 </span></div>
    //                 <div>Endpoint: <code className="bg-gray-200 px-1 rounded text-xs">{selectedResult.endpoint}</code></div>
    //                 <div>Time: {new Date(selectedResult.timestamp).toLocaleString()}</div>
    //               </div>
    //             </div>

    //             {/* Response Data */}
    //             <div>
    //               <h4 className="font-medium text-gray-700 mb-2">Response Data:</h4>
    //               <div className="bg-gray-900 text-green-400 p-4 rounded-md text-xs font-mono max-h-96 overflow-auto">
    //                 <pre>{formatJson(selectedResult.success ? selectedResult.data : selectedResult.error)}</pre>
    //               </div>
    //             </div>

    //             {/* Quick Stats */}
    //             {selectedResult.success && selectedResult.data && (
    //               <div className="bg-blue-50 p-3 rounded">
    //                 <h4 className="font-medium text-blue-800 mb-2">Quick Stats:</h4>
    //                 <div className="text-sm text-blue-700">
    //                   {/* Original API Stats */}
    //                   {selectedResult.data.data && selectedResult.data.data.summary && (
    //                     <div className="grid grid-cols-2 gap-2 mb-4">
    //                       <div>Total Sessions: {selectedResult.data.data.summary.totalSessions || 0}</div>
    //                       <div>Total Interactions: {selectedResult.data.data.summary.totalInteractions || 0}</div>
    //                       <div>Page Views: {selectedResult.data.data.summary.pageViews || 0}</div>
    //                       <div>Chatbot Sessions: {selectedResult.data.data.summary.chatbotSessions || 0}</div>
    //                       <div>Avg Engagement: {selectedResult.data.data.summary.avgEngagementScore || 0}</div>
    //                       <div>Chat Time: {selectedResult.data.data.summary.totalChatTime || 0}s</div>
    //                     </div>
    //                   )}
                      
    //                   {/* Transformed Data Stats */}
    //                   {selectedResult.data.transformedData && (
    //                     <div className="border-t pt-3 mt-3">
    //                       <div className="text-purple-800 font-medium mb-2">Transformed Data:</div>
    //                       <div className="grid grid-cols-2 gap-2">
    //                         <div>Total Hours: {selectedResult.data.totalHours || 0}</div>
    //                         <div>Total Visitors: {selectedResult.data.summary?.totalVisitors || 0}</div>
    //                         <div>Avg Engagement: {Math.round(selectedResult.data.summary?.avgEngagement || 0)}</div>
    //                         <div>Total Sessions: {selectedResult.data.summary?.totalSessions || 0}</div>
    //                         <div>Unique Refs: {selectedResult.data.summary?.uniqueRefs?.length || 0}</div>
    //                         <div>Peak Hour: {selectedResult.data.summary?.peakHour?.hour || 'N/A'}:00</div>
    //                       </div>
                          
    //                       {selectedResult.data.summary?.uniqueRefs && selectedResult.data.summary.uniqueRefs.length > 0 && (
    //                         <div className="mt-2">
    //                           <div className="text-xs text-purple-600">References: {selectedResult.data.summary.uniqueRefs.join(', ')}</div>
    //                         </div>
    //                       )}
    //                     </div>
    //                   )}
                      
    //                   {/* Server Stats */}
    //                   {selectedResult.data.stats && (
    //                     <div>
    //                       <div>Total Users: {selectedResult.data.stats.totalUsers}</div>
    //                       <div>Recent Users: {selectedResult.data.stats.recentUsers}</div>
    //                     </div>
    //                   )}
    //                 </div>
    //               </div>
    //             )}
    //           </div>
    //         ) : (
    //           <div className="text-center text-gray-500 py-8">
    //             <div className="text-4xl mb-2">👆</div>
    //             <p>Click on any API result to view detailed data</p>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   )}

    //   {/* Available Endpoints Info */}
    //   <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
    //     <h3 className="font-medium text-gray-800 mb-3">Available Dashboard Endpoints:</h3>
    //     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
    //       <div className="bg-blue-50 p-2 rounded">
    //         <code className="text-blue-700">GET /api/admin/:userId/analytics</code>
    //         <div className="text-xs text-blue-600">User analytics with timeframe</div>
    //       </div>
    //       <div className="bg-green-50 p-2 rounded">
    //         <code className="text-green-700">GET /api/admin/:userId/analytics/realtime</code>
    //         <div className="text-xs text-green-600">Real-time analytics</div>
    //       </div>
    //       <div className="bg-purple-50 p-2 rounded">
    //         <code className="text-purple-700">GET /api/admin/:userId/analytics/session/:id</code>
    //         <div className="text-xs text-purple-600">Specific session data</div>
    //       </div>
    //       <div className="bg-orange-50 p-2 rounded">
    //         <code className="text-orange-700">GET /api/admin/:userId/analytics/interactions/:type</code>
    //         <div className="text-xs text-orange-600">Interaction analytics</div>
    //       </div>
    //       <div className="bg-indigo-50 p-2 rounded">
    //         <code className="text-indigo-700">GET /api/admin/:userId/analytics/chatbot</code>
    //         <div className="text-xs text-indigo-600">Chatbot analytics</div>
    //       </div>
    //       <div className="bg-gray-50 p-2 rounded">
    //         <code className="text-gray-700">GET /api/admin/stats</code>
    //         <div className="text-xs text-gray-600">Server statistics</div>
    //       </div>
    //     </div>
        
    //     <div className="border-t pt-4">
    //       <h4 className="font-medium text-purple-800 mb-2">Data Transformation:</h4>
    //       <div className="bg-purple-50 p-3 rounded">
    //         <p className="text-sm text-purple-700 mb-2">
    //           The transformation method converts API session data into hourly buckets matching your mock data format:
    //         </p>
    //         <div className="text-xs text-purple-600">
    //           <div>• Groups sessions by hour</div>
    //           <div>• Calculates visitors count and average engagement per hour</div>
    //           <div>• Organizes data by reference sources (refs)</div>
    //           <div>• Provides summary statistics (peak hours, total visitors, etc.)</div>
    //           <div>• Supports 24h, 7d, and 30d timeframes</div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default DataController;