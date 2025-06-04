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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-industrial-blue" />
                <h1 className="text-xl font-bold text-foreground">Isolation Management System</h1>
              </div>
              <div className="text-sm text-muted-foreground">LOTO Database & List Builder</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Global search across all fields..."
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  className="w-80 pl-10"
                />
              </div>
              <Link href="/isolation-points">
                <Button
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Database
                </Button>
              </Link>
              <Button
                onClick={() => handleExportLists()}
                className="bg-safety-orange hover:bg-safety-orange/90 text-white"
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Lists
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Filter Sidebar */}
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
          }}
        />

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Database Table Section */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="bg-white border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Isolation Points Database</h2>
                  <p className="text-sm text-muted-foreground">
                    Showing {displayPoints.length} of {allIsolationPoints.length} isolation points
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleAddSelectedToList}
                    disabled={selectedPoints.length === 0}
                    className="bg-industrial-blue hover:bg-industrial-blue/90 text-white"
                  >
                    Add Selected to List ({selectedPoints.length})
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

          {/* List Builder */}
          {listBuilderOpen && (
            <ListBuilder
              currentList={currentList}
              savedLists={savedLists}
              onRemoveFromList={handleRemoveFromList}
              onReorderList={handleReorderList}
              onUpdateIsolationMethod={handleUpdateIsolationMethod}
              onClose={() => setListBuilderOpen(false)}
              onExport={handleExportLists}
            />
          )}
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
