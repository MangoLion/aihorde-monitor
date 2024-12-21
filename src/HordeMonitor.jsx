import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, X, ArrowUp, ArrowDown } from 'lucide-react';

const API_BASE_URL = 'https://aihorde.net/api/v2';

const INTERVALS = {
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  '30m': 1800000,
  '1hr': 3600000
};

const TIME_PERIODS = {
  '1hr': 60,
  '6hr': 360,
  '24hr': 1440
};

const GenerationDetails = ({ isOpen, onClose, generationId, generationType, apiKey }) => {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!isOpen || !generationId) return;
      
      setLoading(true);
      setError('');
      try {
        const endpoint = generationType === 'image' 
          ? `${API_BASE_URL}/generate/status/${generationId}`
          : `${API_BASE_URL}/generate/text/status/${generationId}`;
          
        const response = await fetch(endpoint, {
          headers: {
            'Client-Agent': 'Horde Monitor v1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, generationId, generationType]);

  const handleCancel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate/status/${generationId}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Client-Agent': 'Horde Monitor v1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel generation: ${response.statusText}`);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generation Details</DialogTitle>
        </DialogHeader>
        {loading && <div className="text-center py-4">Loading...</div>}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {details && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Status</p>
                <p>{details.done ? 'Completed' : 'In Progress'}</p>
              </div>
              <div>
                <p className="font-semibold">Queue Position</p>
                <p>{details.queue_position}</p>
              </div>
              <div>
                <p className="font-semibold">Wait Time</p>
                <p>{details.wait_time}s</p>
              </div>
              <div>
                <p className="font-semibold">Kudos</p>
                <p>{details.kudos}</p>
              </div>
            </div>
            
            {details.generations?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Generations</h3>
                {details.generations.map((gen, index) => (
                  <div key={index} className="border rounded p-4 mb-2">
                    <p><span className="font-semibold">Worker:</span> {gen.worker_name}</p>
                    <p><span className="font-semibold">Model:</span> {gen.model}</p>
                    <p><span className="font-semibold">State:</span> {gen.state}</p>
                    {gen.img && (
                      <img 
                        src={`data:image/webp;base64,${gen.img}`} 
                        alt="Generated" 
                        className="mt-2 max-w-full h-auto" 
                      />
                    )}
                    {gen.text && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p>{gen.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="destructive" onClick={handleCancel}>
                Cancel Generation
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const GenerationListItem = ({ id, type, apiKey, onStatusUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleCancel = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/generate/status/${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': apiKey,
          'Client-Agent': 'Horde Monitor v1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel generation: ${response.statusText}`);
      }

      // Call onStatusUpdate with the cancelled ID
      onStatusUpdate(id, type);
    } catch (err) {
      console.error('Failed to cancel generation:', err);
    }
  };

  return (
    <>
      <div 
        className="text-sm font-mono bg-secondary p-2 rounded flex justify-between items-center cursor-pointer hover:bg-secondary/80"
        onClick={() => setShowDetails(true)}
      >
        <span className="truncate">{id}</span>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleCancel}
          className="ml-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <GenerationDetails
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        generationId={id}
        generationType={type}
        apiKey={apiKey}
      />
    </>
  );
};

const UserDetailsPanel = ({ userData }) => {
    if (!userData) return null;
  
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">General Info</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Username:</span> {userData.username}</p>
                <p><span className="font-medium">Total Kudos:</span> {userData.kudos}</p>
                <p><span className="font-medium">Worker Count:</span> {userData.worker_count}</p>
                <p><span className="font-medium">Account Age:</span> {userData.account_age}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Kudos Details</h3>
              <div className="space-y-1">
                <p><span className="font-medium">Accumulated:</span> {userData.kudos_details?.accumulated}</p>
                <p><span className="font-medium">Gifted:</span> {userData.kudos_details?.gifted}</p>
                <p><span className="font-medium">Received:</span> {userData.kudos_details?.received}</p>
                <p><span className="font-medium">Recurring:</span> {userData.kudos_details?.recurring}</p>
              </div>
            </div>
            
            
          </div>
        </CardContent>
      </Card>
    );
  };

const Dashboard = () => {
    const [apiKey, setApiKey] = useState('');
    const [pollInterval, setPollInterval] = useState('5m');
    const [timePeriod, setTimePeriod] = useState('1hr');
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState([]);
    const [userData, setUserData] = useState(null);
    const [activeGenerations, setActiveGenerations] = useState({
      image: [],
      text: []
    });
    
  

  const handleGenerationCancelled = (id, type) => {
    setActiveGenerations(prev => ({
      ...prev,
      [type]: prev[type].filter(genId => genId !== id)
    }));
  };
  const [stats, setStats] = useState({
    kudosPerHour: 0,
    requestsPerHour: 0
  });

  const intervalIdRef = useRef(null);
  const lastFetchRef = useRef(null);

  const downloadData = () => {
    const csvContent = [
      ['Timestamp', 'Kudos', 'Kudos Change', 'Image Requests', 'Text Requests'],
      ...data.map(point => [
        new Date(point.timestamp).toISOString(),
        point.kudos,
        point.kudosChange || 0,
        point.imageRequests,
        point.textRequests
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horde-monitor-data-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  const fetchUserData = async () => {
    try {
      const now = Date.now();
      if (lastFetchRef.current && (now - lastFetchRef.current) < INTERVALS[pollInterval]) {
        return;
      }
      lastFetchRef.current = now;

      const response = await fetch(`${API_BASE_URL}/find_user`, {
        headers: {
          'apikey': apiKey,
          'Client-Agent': 'Horde Monitor v1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText || 'Unknown error'}`);
      }

      const newUserData = await response.json();
      setUserData(newUserData);
      
      setActiveGenerations({
        image: newUserData.active_generations?.image || [],
        text: newUserData.active_generations?.text || []
      });
      
      const newDataPoint = {
        timestamp: new Date(),
        kudos: newUserData.kudos || 0,
        imageRequests: (newUserData.active_generations?.image || []).length,
        textRequests: (newUserData.active_generations?.text || []).length
      };

      setData(prevData => {
        const newData = [...prevData, newDataPoint].slice(-TIME_PERIODS[timePeriod]);
        
        if (newData.length > 1) {
          const lastIndex = newData.length - 1;
          newData[lastIndex] = {
            ...newData[lastIndex],
            kudosChange: newData[lastIndex].kudos - newData[lastIndex - 1].kudos
          };
          
          const hourInMs = 3600000;
          const timeDiff = newDataPoint.timestamp - newData[0].timestamp;
          const kudosDiff = newDataPoint.kudos - newData[0].kudos;
          
          const avgRequests = newData.reduce((sum, point) => 
            sum + point.imageRequests + point.textRequests, 0) / newData.length;
          
          const scaleFactor = hourInMs / timeDiff;
          setStats({
            kudosPerHour: Math.round(kudosDiff * scaleFactor),
            requestsPerHour: Math.round(avgRequests)
          });
        }
        
        return newData;
      });
    } catch (err) {
      setError(err.message);
      stopMonitoring();
    }
  };

  const startMonitoring = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }
    setError('');
    setIsMonitoring(true);
    await fetchUserData();
    intervalIdRef.current = window.setInterval(fetchUserData, INTERVALS[pollInterval]);
  };

  const stopMonitoring = () => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    lastFetchRef.current = null;
    setIsMonitoring(false);
  };

  const handleIntervalChange = (newInterval) => {
    setPollInterval(newInterval);
    if (isMonitoring) {
      stopMonitoring();
      setTimeout(startMonitoring, 100);
    }
  };

  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
    setData(prevData => prevData.slice(-TIME_PERIODS[newPeriod]));
  };

  const getFilteredData = () => {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - TIME_PERIODS[timePeriod]);
    return data.filter(point => new Date(point.timestamp) >= cutoffTime);
  };

  const filteredData = getFilteredData();

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Horde Monitor</CardTitle>
          <ThemeToggle />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              className="flex-1"
            />
            <Select 
              value={pollInterval} 
              onValueChange={handleIntervalChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERVALS).map(([label]) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              disabled={!apiKey || !pollInterval}
              className={`w-32 ${isMonitoring ? 
                'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 
                'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>

            {data.length > 0 && (
            <Button 
              onClick={downloadData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Data
            </Button>
          )}
          </div>

          

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {stats.kudosPerHour > 0 ? (
                    <ArrowUp className="w-5 h-5 text-green-500" />
                  ) : stats.kudosPerHour < 0 ? (
                    <ArrowDown className="w-5 h-5 text-red-500" />
                  ) : null}
                  Δ Kudos/Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  stats.kudosPerHour > 0 ? 'text-green-600' : 
                  stats.kudosPerHour < 0 ? 'text-red-600' : ''
                }`}>
                  {stats.kudosPerHour}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requests/Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.requestsPerHour}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mb-4 items-center gap-2">
            <span className="font-medium">Time Period:</span>
            <Select 
              value={timePeriod} 
              onValueChange={handleTimePeriodChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIME_PERIODS).map(([label]) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Kudos Change</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="kudosChange"
                      stroke="#8884d8"
                      name="Kudos Change"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Requests</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="imageRequests"
                      stroke="#82ca9d"
                      name="Image Requests"
                    />
                    <Line
                      type="monotone"
                      dataKey="textRequests"
                      stroke="#ffc658"
                      name="Text Requests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Generation IDs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Image Generations ({activeGenerations.image.length})</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {activeGenerations.image.map(id => (
                      <GenerationListItem
                        key={id}
                        id={id}
                        type="image"
                        apiKey={apiKey}
                        onStatusUpdate={handleGenerationCancelled}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Text Generations ({activeGenerations.text.length})</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {activeGenerations.text.map(id => (
                      <GenerationListItem
                        key={id}
                        id={id}
                        type="text"
                        apiKey={apiKey}
                        onStatusUpdate={fetchUserData}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <UserDetailsPanel userData={userData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
