import { useState } from "react";
import { Eye, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { IsolationPoint } from "@shared/schema";

interface IsolationTableProps {
  points: IsolationPoint[];
  isLoading: boolean;
  selectedPoints: number[];
  onSelectionChange: (pointIds: number[]) => void;
  onViewDetails: (point: IsolationPoint) => void;
  onAddToList: (point: IsolationPoint) => void;
}

type SortField = 'kks' | 'unit' | 'description' | 'type' | 'isolationMethod' | 'normalPosition';
type SortDirection = 'asc' | 'desc';

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'electrical': return 'bg-red-100 text-red-800 border-red-200';
    case 'mechanical': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'hydraulic': return 'bg-green-100 text-green-800 border-green-200';
    case 'pneumatic': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPositionColor = (position: string) => {
  switch (position.toLowerCase()) {
    case 'open': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-red-100 text-red-800';
    case 'energized': return 'bg-green-100 text-green-800';
    case 'de-energized': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function IsolationTable({
  points,
  isLoading,
  selectedPoints,
  onSelectionChange,
  onViewDetails,
  onAddToList,
}: IsolationTableProps) {
  const [sortField, setSortField] = useState<SortField>('kks');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPoints = [...points].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    return 0;
  });

  const totalPages = Math.ceil(sortedPoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPoints = sortedPoints.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = currentPoints.map(point => point.id);
      const uniqueIds = [...selectedPoints];
      allIds.forEach(id => {
        if (!uniqueIds.includes(id)) {
          uniqueIds.push(id);
        }
      });
      onSelectionChange(uniqueIds);
    } else {
      const currentIds = currentPoints.map(point => point.id);
      onSelectionChange(selectedPoints.filter(id => !currentIds.includes(id)));
    }
  };

  const handleSelectPoint = (pointId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPoints, pointId]);
    } else {
      onSelectionChange(selectedPoints.filter(id => id !== pointId));
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-gray-600" />
      : <ChevronDown className="h-3 w-3 text-gray-600" />;
  };

  const allCurrentSelected = currentPoints.length > 0 && currentPoints.every(point => selectedPoints.includes(point.id));
  const someCurrentSelected = currentPoints.some(point => selectedPoints.includes(point.id));

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-white">
        <div className="space-y-2 p-4">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] table-fixed">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-2 sm:px-4 py-3 text-left">
                  <Checkbox
                    checked={allCurrentSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="w-28 sm:w-32 px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('kks')}
                    className="flex items-center space-x-1 hover:text-foreground touch-manipulation"
                >
                  <span>KKS</span>
                  <SortIcon field="kks" />
                </button>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort('unit')}
                  className="flex items-center space-x-1 hover:text-foreground"
                >
                  <span>Unit</span>
                  <SortIcon field="unit" />
                </button>
              </th>
              <th className="w-64 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort('description')}
                  className="flex items-center space-x-1 hover:text-foreground"
                >
                  <span>Description</span>
                  <SortIcon field="description" />
                </button>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center space-x-1 hover:text-foreground"
                >
                  <span>Type</span>
                  <SortIcon field="type" />
                </button>
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Panel KKS
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort('isolationMethod')}
                  className="flex items-center space-x-1 hover:text-foreground"
                >
                  <span>Method</span>
                  <SortIcon field="isolationMethod" />
                </button>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort('normalPosition')}
                  className="flex items-center space-x-1 hover:text-foreground"
                >
                  <span>Position</span>
                  <SortIcon field="normalPosition" />
                </button>
              </th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border">
            {currentPoints.map((point) => (
              <tr
                key={point.id}
                className="hover:bg-muted/30 cursor-pointer table-row-hover"
                onClick={() => handleSelectPoint(point.id, !selectedPoints.includes(point.id))}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedPoints.includes(point.id)}
                    onCheckedChange={(checked) => handleSelectPoint(point.id, !!checked)}
                  />
                </td>
                <td className="px-4 py-4 text-sm font-medium text-industrial-blue font-mono">
                  {point.kks}
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {point.unit}
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  <div className="truncate" title={point.description}>
                    {point.description}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className={getTypeColor(point.type)}>
                    <span className="w-2 h-2 rounded-full bg-current mr-1.5"></span>
                    {point.type}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                  {point.panelKks || '-'}
                </td>
                <td className="px-4 py-4 text-sm text-foreground">
                  {point.isolationMethod}
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className={getPositionColor(point.normalPosition)}>
                    {point.normalPosition}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(point)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAddToList(point)}
                      className="h-8 w-8 p-0 text-safety-orange hover:text-safety-orange/80"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedPoints.length)} of {sortedPoints.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex space-x-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-industrial-blue hover:bg-industrial-blue/90" : ""}
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2 text-muted-foreground">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
