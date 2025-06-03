import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, BarChart3, Shield, AlertTriangle, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Fetch analytics data
  const { data: executionStats, isLoading: executionStatsLoading } = useQuery({
    queryKey: ["/api/analytics/execution-statistics", startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!startDate && !!endDate,
  });

  const { data: safetyStats, isLoading: safetyStatsLoading } = useQuery({
    queryKey: ["/api/analytics/safety-statistics", startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!startDate && !!endDate,
  });

  const { data: equipmentStats, isLoading: equipmentStatsLoading } = useQuery({
    queryKey: ["/api/analytics/equipment-statistics"],
  });

  const { data: performanceMetrics, isLoading: performanceMetricsLoading } = useQuery({
    queryKey: ["/api/analytics/performance-metrics", startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!startDate && !!endDate,
  });

  const { data: complianceReport, isLoading: complianceReportLoading } = useQuery({
    queryKey: ["/api/analytics/compliance-report", startDate?.toISOString(), endDate?.toISOString()],
    enabled: !!startDate && !!endDate,
  });

  const formatDateForAPI = (date: Date | undefined) => {
    return date ? date.toISOString().split('T')[0] : undefined;
  };

  const getSafetyColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-industrial-blue" />
              <h1 className="text-xl font-semibold text-foreground">Analytics Dashboard</h1>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="start-date" className="text-sm font-medium">From:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[120px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="end-date" className="text-sm font-medium">To:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[120px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="safety">Safety Metrics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{executionStats?.totalExecutions || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {executionStats?.completedExecutions || 0} completed
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {getCompletionRate(executionStats?.completedExecutions || 0, executionStats?.totalExecutions || 1)}%
                  </div>
                  <Progress 
                    value={getCompletionRate(executionStats?.completedExecutions || 0, executionStats?.totalExecutions || 1)} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Incidents</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safetyStats?.totalIncidents || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {safetyStats?.criticalIncidents || 0} critical
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {executionStats?.avgCompletionTime ? `${Math.round(executionStats.avgCompletionTime * 10) / 10}h` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average duration
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Status Breakdown</CardTitle>
                <CardDescription>Current status of all procedures in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <Badge variant="secondary">{executionStats?.completedExecutions || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <Badge variant="secondary">{executionStats?.inProgressExecutions || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Failed</span>
                    </div>
                    <Badge variant="secondary">{executionStats?.failedExecutions || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Metrics Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Safety Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Incidents</span>
                    <Badge variant="outline">{safetyStats?.totalIncidents || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Resolved</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {safetyStats?.resolvedIncidents || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Resolution Time</span>
                    <Badge variant="outline">
                      {safetyStats?.avgResolutionTime ? `${Math.round(safetyStats.avgResolutionTime * 10) / 10}h` : 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incident Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Critical</span>
                    </div>
                    <Badge variant="destructive">{safetyStats?.criticalIncidents || 0}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>High</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">{safetyStats?.highIncidents || 0}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Medium</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">{safetyStats?.mediumIncidents || 0}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Low</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{safetyStats?.lowIncidents || 0}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Performance Metrics by Operator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics && performanceMetrics.length > 0 ? (
                    performanceMetrics.map((metric: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{metric.executorName}</h4>
                            <p className="text-sm text-muted-foreground">{metric.unit}</p>
                          </div>
                          <Badge variant="outline">
                            {metric.totalExecutions} procedures
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Completion Rate:</span>
                            <div className="font-medium">
                              {getCompletionRate(metric.completedExecutions, metric.totalExecutions)}%
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Avg. Time:</span>
                            <div className="font-medium">
                              {metric.avgCompletionTime ? `${Math.round(metric.avgCompletionTime * 10) / 10}h` : 'N/A'}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Safety Score:</span>
                            <div className="font-medium text-green-600">
                              {metric.safetyIncidents === 0 ? 'Excellent' : 'Needs Attention'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available for the selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Usage Statistics</CardTitle>
                <CardDescription>Isolation point usage and performance by unit and type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipmentStats && equipmentStats.length > 0 ? (
                    equipmentStats.map((stat: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{stat.unit} - {stat.type}</h4>
                            <p className="text-sm text-muted-foreground">{stat.isolationMethod}</p>
                          </div>
                          <Badge variant="outline">
                            {stat.totalPoints} points
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Executions:</span>
                            <div className="font-medium">{stat.executionCount || 0}</div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Avg. Execution Time:</span>
                            <div className="font-medium">
                              {stat.avgExecutionTime ? `${Math.round(stat.avgExecutionTime * 10) / 10} min` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No equipment data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Compliance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Procedures</span>
                    <Badge variant="outline">{complianceReport?.totalProcedures || 0}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Completed On Time</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {complianceReport?.completedOnTime || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>With Supervision</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {complianceReport?.proceduresWithVerification || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>With Incidents</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {complianceReport?.proceduresWithIncidents || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Point Completion Rate</CardTitle>
                  <CardDescription>Average percentage of isolation points completed per procedure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-green-600">
                      {complianceReport?.avgPointCompletionRate ? 
                        `${Math.round(complianceReport.avgPointCompletionRate)}%` : 'N/A'}
                    </div>
                    <Progress 
                      value={complianceReport?.avgPointCompletionRate || 0} 
                      className="w-full" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Industry target: 95%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}