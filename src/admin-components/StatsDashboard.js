import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DataController from "./helper-components/DataController";
import { GraphDataTransformation, GetAnalyticsData } from "./helper-components/graphData.js";

import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  Calendar,
  Filter,
  Settings,
  Plus,
  Copy,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  ExternalLink,
  Save,
  X
} from "lucide-react";

function StatsDashboard({ darkMode = true, userId = "user_12345" }) {
  const [selectedMetric, setSelectedMetric] = useState('visitors');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedRefFilter, setSelectedRefFilter] = useState('all');
  const [showRefConfig, setShowRefConfig] = useState(false);
  const [newRefName, setNewRefName] = useState('');
  const [newRefValue, setNewRefValue] = useState('');
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);
  const [isSavingRefs, setIsSavingRefs] = useState(false);
  const [refsError, setRefsError] = useState(null);

  // State for refs loaded from API
  const [refLinks, setRefLinks] = useState([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});

  // FIXED: Corrected API base URL to match your server port
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

  // FIXED: Updated loadRefs function with proper error handling and debugging
   const loadRefs = async () => {
    setIsLoadingRefs(true);
    setRefsError(null);
    try {
      const url = `${API_BASE}/users/${userId}/settings/refs`;
      console.log('Loading refs from URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      if (data.success && data.data && data.data.refs) {
        // Convert API refs format to component format
        const refsArray = Object.entries(data.data.refs)
          .filter(([key]) => !['lastUpdated', 'updatedAt'].includes(key))
          .map(([key, value]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
            value: value,
            url: `${window.location.origin}/${userId}?ref=${key}`,
            clicks: 0 // Will be populated from analytics
          }));
        
        setRefLinks(refsArray);
        console.log('Processed refs:', refsArray);
      } else {
        console.log('No refs found in API response or invalid format');
        setRefLinks([]);
      }
    } catch (error) {
      console.error('Error loading refs:', error);
      setRefsError(`Failed to load refs: ${error.message}`);
      // Don't clear existing refs on network error, just show error
      if (error.name === 'TypeError') {
        setRefsError('Network error: Please check if the server is running');
      }
    } finally {
      setIsLoadingRefs(false);
    }
  };

  // FIXED: Updated saveRefs function with better error handling
  const saveRefs = async (refsToSave) => {
    setIsSavingRefs(true);
    setRefsError(null);
    try {
      // Convert refs array back to object format for API
      const refsObject = {};
      refsToSave.forEach(ref => {
        refsObject[ref.id] = ref.value || ref.name;
      });

      console.log('Saving refs object:', refsObject);
      
      const url = `${API_BASE}/users/${userId}/settings/refs`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refsObject)
      });

      console.log('Save response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Save response data:', data);
      
      if (data.success) {
        console.log('Refs saved successfully');
        // Reload refs to get latest data
        await loadRefs();
        return true;
      } else {
        throw new Error(data.message || 'Failed to save refs');
      }
    } catch (error) {
      console.error('Error saving refs:', error);
      setRefsError(`Error saving refs: ${error.message}`);
      return false;
    } finally {
      setIsSavingRefs(false);
    }
  };

  // FIXED: Updated deleteRef function with proper error handling
  const deleteRef = async (refId) => {
    setRefsError(null);
    try {
      const url = `${API_BASE}/users/${userId}/settings/refs/${refId}`;
      console.log('Deleting ref from URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.success) {
        console.log(`Ref ${refId} deleted successfully`);
        // Remove from local state immediately
        const updatedRefs = refLinks.filter(ref => ref.id !== refId);
        setRefLinks(updatedRefs);
        
        if (selectedRefFilter === refId) {
          setSelectedRefFilter('all');
        }
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete ref');
      }
    } catch (error) {
      console.error('Error deleting ref:', error);
      setRefsError(`Error deleting ref: ${error.message}`);
      return false;
    }
  };



  const loadRealData = async (timeframe = '24h') => {
    try {
      // Load both chart data and analytics data simultaneously
      const [graphResult, analyticsResult] = await Promise.all([
        GraphDataTransformation(timeframe, userId),
        GetAnalyticsData(timeframe, userId)
      ]);

      // Handle chart data
      if (graphResult && graphResult.transformedData) {
        setChartData(graphResult.transformedData);
        console.log('Real chart data loaded:', graphResult);
      } else {
        console.error('Failed to load real chart data, using fallback');
        setChartData(generateMockData(timeframe));
      }

      // Handle analytics data
      if (analyticsResult) {
        setAnalyticsData(analyticsResult);
        console.log('Real analytics data loaded:', analyticsResult);
      } else {
        console.error('Failed to load real analytics data, using fallback');
        setAnalyticsData(getMockAnalyticsData(timeframe));
      }

    } catch (error) {
      console.error('Error loading real data:', error);
      // Fallback to mock data on error
      setChartData(generateMockData(timeframe));
      setAnalyticsData(getMockAnalyticsData(timeframe));
    }
  };

  // Mock data fallback function
  const getMockAnalyticsData = () => ({});

  // Mock data for the time series (fallback)
  const generateMockData = (timeframe = '24h') => {
    const data = [];
    const now = new Date();
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 8760;
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const baseVisitors = 0;
      const baseEngagement = 0;

      data.push({
        time: time.toISOString(),
        hour: time.getHours(),
        visitors: baseVisitors,
        engagement: baseEngagement,
        refs: {
          visits: {},
          engagement: {}
        }
      });
    }

    return data;
  };

  const filteredChartData = useMemo(() => {
    if (selectedRefFilter === 'all') return chartData;

    return chartData.map(point => {
      const visitCount = point.refs?.visits[selectedRefFilter] || 0;
      const engagementCount = point.refs?.engagement[selectedRefFilter] || 0;

      return {
        ...point,
        visitors: visitCount,
        engagement: engagementCount
      };
    });
  }, [chartData, selectedRefFilter]);

  // Mock leads data
  const [leads, setLeads] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 123-4567",
      message: "Hi! I'm interested in your insurance services for my small business. Could we schedule a consultation?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ref: "linkedin",
      status: "new"
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "mchen@company.com",
      phone: "+1 (555) 987-6543",
      message: "Looking for property investment advice. I saw your profile and would like to discuss opportunities in the downtown area.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      ref: "twitter",
      status: "new"
    }
  ]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const time = new Date(label);
      
      return (
        <div className={`${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        } border rounded-lg p-3 shadow-lg`}>
          <p className="font-medium mb-2">
            {time.toLocaleDateString()} {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-blue-500">
            {selectedMetric === 'visitors' ? 'Visitors' : 'Engagement'}: {payload[0].value}
          </p>
          {selectedRefFilter === 'all' && data.refs && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-sm font-medium mb-1">By Reference ({selectedMetric}):</p>
              {refLinks.map(ref => {
                const refValue = selectedMetric === 'visitors' 
                  ? data.refs.visits[ref.id] 
                  : data.refs.engagement[ref.id];
                return (
                  <p key={ref.id} className="text-sm">
                    {ref.name}: {refValue || 0}
                  </p>
                );
              })}
            </div>
          )}
          {selectedRefFilter !== 'all' && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-sm font-medium mb-1">Source:</p>
              <p className="text-sm">
                {refLinks.find(ref => ref.id === selectedRefFilter)?.name || 'Unknown'}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const addRefLink = async () => {
    if (newRefName.trim() && newRefValue.trim()) {
      const refId = newRefName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const newRef = {
        id: refId,
        name: newRefName.trim(),
        value: newRefValue.trim(),
        url: `${window.location.origin}/${userId}?ref=${refId}`,
        clicks: 0
      };
      
      const updatedRefs = [...refLinks, newRef];
      setRefLinks(updatedRefs);
      
      // Save to API
      await saveRefs(updatedRefs);
      
      setNewRefName('');
      setNewRefValue('');
    }
  };

  const removeRefLink = async (id) => {
    await deleteRef(id);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUp size={16} className="text-green-400" />;
    if (change < 0) return <ArrowDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  useEffect(() => {
    loadRealData(timeRange);
  }, [timeRange, userId]);

  useEffect(() => {
    loadRefs();
  }, [userId]);

  // Show loading state
  if (isLoadingData) {
    return (
      <div className={`transition-colors max-w-6xl mx-auto duration-300 ${darkMode ? 'text-white' : 'text-gray-900'} p-4 lg:p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-colors max-w-6xl mx-auto duration-300 ${darkMode ? 'text-white' : 'text-gray-900'} p-4 lg:p-6`}>
      <DataController setChartData={setChartData} chartData={chartData} />
      
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm lg:text-base`}>
          Track your profile performance and manage incoming leads
        </p>
      </div>

      {/* Performance & Analytics Component */}
      <div className={`mb-6 ${
        darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
      } backdrop-blur-md rounded-2xl border p-4 lg:p-6 relative overflow-hidden`}>
        
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-lg lg:text-xl font-semibold">
              {showRefConfig ? 'Reference Link Management' : 'Performance Metrics'}
            </h2>
            
            {/* Metric Toggle - Hidden in config mode */}
            {!showRefConfig && (
              <div className={`flex rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1 w-fit`}>
                <button
                  onClick={() => setSelectedMetric('visitors')}
                  className={`flex items-center px-2 lg:px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedMetric === 'visitors'
                      ? 'bg-blue-500 text-white'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye size={14} className="mr-1" />
                  Visitors
                </button>
                <button
                  onClick={() => setSelectedMetric('engagement')}
                  className={`flex items-center px-2 lg:px-3 py-1 rounded-md text-sm transition-colors ${
                    selectedMetric === 'engagement'
                      ? 'bg-blue-500 text-white'
                      : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MousePointer size={14} className="mr-1" />
                  Engagement
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {/* Controls - Hidden in config mode */}
            {!showRefConfig && (
              <>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 focus:border-blue-500' 
                      : 'bg-white border-gray-200 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="1y">Last Year</option>
                </select>

                <select
                  value={selectedRefFilter}
                  onChange={(e) => setSelectedRefFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 focus:border-blue-500' 
                      : 'bg-white border-gray-200 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                >
                  <option value="all">All Sources</option>
                  {refLinks.map(ref => (
                    <option key={ref.id} value={ref.id}>{ref.name}</option>
                  ))}
                </select>
              </>
            )}

            {/* Config Toggle Button */}
            <button
              onClick={() => setShowRefConfig(!showRefConfig)}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-200 hover:bg-gray-50'
              } ${showRefConfig ? 'bg-blue-500/20 border-blue-400' : ''}`}
            >
              {showRefConfig ? <X size={16} /> : <Settings size={16} />}
            </button>
          </div>
        </div>

        {/* Content with smooth transition */}
        <div className="relative">
          {/* Analytics Content */}
          <div className={`transition-all duration-500 ease-in-out ${
            showRefConfig 
              ? 'opacity-0 transform translate-y-4 pointer-events-none absolute inset-0' 
              : 'opacity-100 transform translate-y-0'
          }`}>
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Chart Section */}
              <div className="flex-1">
                <div className="h-64 sm:h-72 lg:h-80 xl:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => {
                          const date = new Date(time);
                          if (timeRange === '24h') return date.getHours() + ':00';
                          return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }}
                        stroke={darkMode ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#9c7a08ff" 
                        strokeWidth={2}
                        dot={{ fill: '#e4ca36ff', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#fffb00ff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytics Summary */}
              <div className="xl:w-80 xl:flex-shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  {/* Visitors */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Eye size={18} className="mr-2 text-blue-400" />
                        <span className="font-medium">Visitors</span>
                      </div>
                      <div className="flex items-center">
                        {getChangeIcon(analyticsData[timeRange]?.visitors?.change || 0)}
                        <span className={`text-sm ml-1 ${getChangeColor(analyticsData[timeRange]?.visitors?.change || 0)}`}>
                          {Math.abs(analyticsData[timeRange]?.visitors?.change || 0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{(analyticsData[timeRange]?.visitors?.current || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      vs {(analyticsData[timeRange]?.visitors?.previous || 0).toLocaleString()} previous
                    </p>
                  </div>

                  {/* Engagement */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <MousePointer size={18} className="mr-2 text-green-400" />
                        <span className="font-medium">Engagement</span>
                      </div>
                      <div className="flex items-center">
                        {getChangeIcon(analyticsData[timeRange]?.engagement?.change || 0)}
                        <span className={`text-sm ml-1 ${getChangeColor(analyticsData[timeRange]?.engagement?.change || 0)}`}>
                          {Math.abs(analyticsData[timeRange]?.engagement?.change || 0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{(analyticsData[timeRange]?.engagement?.current || 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      vs {(analyticsData[timeRange]?.engagement?.previous || 0).toLocaleString()} previous
                    </p>
                  </div>

                  {/* Reference Sources */}
                  <div className={`sm:col-span-2 xl:col-span-1 p-4 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <h3 className="font-medium mb-3 flex items-center">
                      <ExternalLink size={18} className="mr-2 text-purple-400" />
                      Traffic Sources
                    </h3>
                    <div className="space-y-3">
                      {refLinks.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between">
                          <span className="text-sm truncate mr-2">{ref.name}</span>
                          <div className="flex items-center flex-shrink-0">
                            <span className="text-sm font-medium mr-2">
                              {analyticsData[timeRange]?.refs?.[ref.id]?.current || 0}
                            </span>
                            <div className="flex items-center">
                              {getChangeIcon(analyticsData[timeRange]?.refs?.[ref.id]?.change || 0)}
                              <span className={`text-xs ml-1 ${getChangeColor(analyticsData[timeRange]?.refs?.[ref.id]?.change || 0)}`}>
                                {Math.abs(analyticsData[timeRange]?.refs?.[ref.id]?.change || 0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ref Configuration Content */}
          <div className={`transition-all duration-500 ease-in-out ${
            !showRefConfig 
              ? 'opacity-0 transform translate-y-4 pointer-events-none absolute inset-0' 
              : 'opacity-100 transform translate-y-0'
          }`}>
            {/* Add New Ref */}
            <div className="mb-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Reference name (e.g., LinkedIn)"
                    value={newRefName}
                    onChange={(e) => setNewRefName(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-600 focus:border-blue-500' 
                        : 'bg-white border-gray-200 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  />
                  <input
                    type="text"
                    placeholder="Reference URL or value"
                    value={newRefValue}
                    onChange={(e) => setNewRefValue(e.target.value)}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      darkMode 
                        ? 'bg-gray-900 border-gray-600 focus:border-blue-500' 
                        : 'bg-white border-gray-200 focus:border-blue-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                  />
                </div>
                <button
                  onClick={addRefLink}
                  disabled={!newRefName.trim() || !newRefValue.trim() || isSavingRefs}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center ${
                    !newRefName.trim() || !newRefValue.trim() || isSavingRefs
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500/20 border border-blue-400 text-blue-400 hover:bg-blue-500/30'
                  }`}
                >
                  {isSavingRefs ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add Reference
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading state for refs */}
            {isLoadingRefs && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
                <span>Loading references...</span>
              </div>
            )}

            {/* Existing Refs */}
            {!isLoadingRefs && (
              <div className="space-y-3">
                {refLinks.map(ref => (
                  <div key={ref.id} className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-lg">{ref.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          Value: {ref.value}
                        </p>
                        <p className="text-sm text-gray-500 font-mono break-all">
                          Tracking URL: {ref.url}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 justify-end flex-shrink-0">
                        <button
                          onClick={() => copyToClipboard(ref.url)}
                          className={`p-2 rounded transition-colors ${
                            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                          title="Copy tracking URL"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => removeRefLink(ref.id)}
                          className={`p-2 rounded transition-colors ${
                            darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-500'
                          }`}
                          title="Delete reference"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {refLinks.length === 0 && !isLoadingRefs && (
                  <div className={`text-center py-8 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <ExternalLink size={24} className="mx-auto mb-2 opacity-50" />
                    <p>No reference links configured yet</p>
                    <p className="text-sm">Add your first reference link above to start tracking</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inbox Component */}
      <div className={`${
        darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
      } backdrop-blur-md rounded-2xl border p-4 lg:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg lg:text-xl font-semibold flex items-center">
            <MessageSquare size={24} className="mr-2" />
            Lead Inbox
          </h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {leads.filter(lead => lead.status === 'new').length} New
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {leads.map(lead => (
            <div key={lead.id} className={`p-4 rounded-lg border transition-colors ${
              lead.status === 'new'
                ? darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                : darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 gap-3">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                    <h3 className="font-semibold">{lead.name}</h3>
                    {lead.status === 'new' && (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 w-fit">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4 mb-2">
                    <span className="flex items-center">
                      <Mail size={14} className="mr-1 flex-shrink-0" />
                      <span className="break-all">{lead.email}</span>
                    </span>
                    <span className="flex items-center">
                      <Phone size={14} className="mr-1 flex-shrink-0" />
                      {lead.phone}
                    </span>
                  </div>
                </div>
                <div className="lg:text-right">
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <Clock size={14} className="mr-1" />
                    {formatTimeAgo(lead.timestamp)}
                  </div>
                  <div className="flex items-center text-xs">
                    <ExternalLink size={12} className="mr-1" />
                    from {refLinks.find(ref => ref.id === lead.ref)?.name || 'Unknown'}
                  </div>
                </div>
              </div>
              
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                {lead.message}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <button className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  darkMode 
                    ? 'bg-blue-500/20 border border-blue-400 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  Reply
                </button>
                <button className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  darkMode 
                    ? 'border border-gray-600 text-gray-400 hover:bg-gray-700' 
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsDashboard;