import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, Download, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { IsolationPoint, SavedList, FilterOptions } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import IsolationTable from "@/components/isolation-table";
import FilterSidebar from "@/components/filter-sidebar";
import ListBuilder from "@/components/list-builder";
import DetailModal from "@/components/detail-modal";

export default function IsolationManagement() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [currentList, setCurrentList] = useState<IsolationPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<IsolationPoint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [listBuilderOpen, setListBuilderOpen] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all isolation points
  const { data: allIsolationPoints = [], isLoading: pointsLoading } = useQuery<IsolationPoint[]>({
    queryKey: ["/api/isolation-points"],
  });

  // Fetch saved lists
  const { data: savedLists = [] } = useQuery<SavedList[]>({
    queryKey: ["/api/saved-lists"],
  });

  // Search isolation points with filters
  const { data: filteredPoints = [], isLoading: searchLoading } = useQuery<IsolationPoint[]>({
    queryKey: ["/api/isolation-points/search", { ...filters, search: globalSearch }],
    enabled: Object.keys(filters).length > 0 || globalSearch.length > 0,
  });

  // Use filtered points if filters are applied, otherwise use all points
  const displayPoints = Object.keys(filters).length > 0 || globalSearch.length > 0 
    ? filteredPoints 
    : allIsolationPoints;

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async (data: { isolationPointIds: number[]; jsaNumber?: string; workOrder?: string; jobDescription?: string; listName?: string }) => {
      const response = await apiRequest("POST", "/api/export/isolation-list", data);
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'isolation-points.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Successful",
        description: "Isolation points exported to CSV file.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export isolation points.",
        variant: "destructive",
      });
    },
  });

  const handleGlobalSearch = (value: string) => {
    setGlobalSearch(value);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handlePointSelection = (pointIds: number[]) => {
    setSelectedPoints(pointIds);
  };

  const handleAddToList = (points: IsolationPoint[]) => {
    const newPoints = points.filter(point => 
      !currentList.some(listPoint => listPoint.id === point.id)
    );
    setCurrentList([...currentList, ...newPoints]);
    toast({
      title: "Added to List",
      description: `${newPoints.length} point(s) added to current list.`,
    });
  };

  const handleRemoveFromList = (pointId: number) => {
    setCurrentList(currentList.filter(point => point.id !== pointId));
  };

  const handleReorderList = (newOrder: IsolationPoint[]) => {
    setCurrentList(newOrder);
  };

  const handleUpdateIsolationMethod = (pointId: number, newMethod: string) => {
    setCurrentList(currentList.map(point => 
      point.id === pointId 
        ? { ...point, isolationMethod: newMethod }
        : point
    ));
    toast({
      title: "Method Updated",
      description: "Isolation method has been updated for this procedure.",
    });
  };

  const handleViewDetails = (point: IsolationPoint) => {
    setSelectedPoint(point);
    setShowDetailModal(true);
  };

  const handleExportLists = (exportData?: { listName?: string; jsaNumber?: string; workOrder?: string; jobDescription?: string }) => {
    if (currentList.length === 0) {
      toast({
        title: "No Points Selected",
        description: "Add isolation points to your list before exporting.",
        variant: "destructive",
      });
      return;
    }
    
    const pointIds = currentList.map(point => point.id);
    exportMutation.mutate({
      isolationPointIds: pointIds,
      ...exportData
    });
  };

  const handleAddSelectedToList = () => {
    const pointsToAdd = allIsolationPoints.filter(point => 
      selectedPoints.includes(point.id)
    );
    handleAddToList(pointsToAdd);
    setSelectedPoints([]);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-industrial-blue" />
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Isolation Management</h1>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">LOTO Database & List Builder</div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Global search..."
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  className="w-full sm:w-64 lg:w-80 pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Link href="/isolation-points" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Manage Database</span>
                  </Button>
                </Link>
                <Button
                  onClick={() => handleExportLists()}
                  className="flex-1 sm:flex-none bg-safety-orange hover:bg-safety-orange/90 text-white"
                  disabled={exportMutation.isPending}
                  size="sm"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Export Lists</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden bg-white border-b border-border p-3">
        <Button
          variant="outline"
          onClick={() => setListBuilderOpen(!listBuilderOpen)}
          className="w-full justify-center"
          size="sm"
        >
          {listBuilderOpen ? 'Hide' : 'Show'} Filters & Lists
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)] lg:h-[calc(100vh-73px)]">
        {/* Filter Sidebar - Collapsible on mobile */}
        <div className={`${listBuilderOpen ? 'block' : 'hidden'} lg:block`}>
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            savedLists={savedLists}
            onLoadList={(list) => {
              const listPoints = allIsolationPoints.filter(point => 
                list.isolationPointIds.includes(point.id)
              );
              setCurrentList(listPoints);
              toast({
                title: "List Loaded",
                description: `Loaded "${list.name}" with ${listPoints.length} points.`,
              });
              // Auto-hide sidebar on mobile after loading
              if (window.innerWidth < 1024) {
                setListBuilderOpen(false);
              }
            }}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Database Table Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-white border-b border-border p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">Isolation Points Database</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Showing {displayPoints.length} of {allIsolationPoints.length} isolation points
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleAddSelectedToList}
                    disabled={selectedPoints.length === 0}
                    className="flex-1 sm:flex-none bg-industrial-blue hover:bg-industrial-blue/90 text-white"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Add Selected to List</span>
                    <span className="sm:hidden">Add to List</span>
                    <span className="ml-1">({selectedPoints.length})</span>
                  </Button>
                </div>
              </div>
            </div>

            <IsolationTable
              points={displayPoints}
              isLoading={pointsLoading || searchLoading}
              selectedPoints={selectedPoints}
              onSelectionChange={handlePointSelection}
              onViewDetails={handleViewDetails}
              onAddToList={(point) => handleAddToList([point])}
            />
          </div>

          {/* List Builder - Desktop: side panel, Mobile: full screen overlay */}
          <div className={`${listBuilderOpen ? 'block' : 'hidden'} lg:block ${listBuilderOpen ? 'fixed lg:relative inset-0 lg:inset-auto z-50 lg:z-auto bg-white lg:bg-transparent' : ''}`}>
            <ListBuilder
              currentList={currentList}
              savedLists={savedLists}
              onRemoveFromList={handleRemoveFromList}
              onReorderList={handleReorderList}
              onUpdateIsolationMethod={handleUpdateIsolationMethod}
              onClose={() => setListBuilderOpen(false)}
              onExport={handleExportLists}
            />
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      <DetailModal
        point={selectedPoint}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedPoint(null);
        }}
        onAddToList={(point) => handleAddToList([point])}
      />
    </div>
  );
}
