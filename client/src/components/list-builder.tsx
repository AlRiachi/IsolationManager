import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, Save, FileText, Download, Share, Trash2, 
  GripVertical, ChevronUp, ChevronDown, Info, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { IsolationPoint, SavedList, InsertSavedList } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateLOTOPDF } from "@/lib/pdf-generator";

interface ListBuilderProps {
  currentList: IsolationPoint[];
  savedLists: SavedList[];
  onRemoveFromList: (pointId: number) => void;
  onReorderList: (newOrder: IsolationPoint[]) => void;
  onUpdateIsolationMethod: (pointId: number, newMethod: string) => void;
  onClose: () => void;
  onExport: (exportData?: { listName?: string; jsaNumber?: string; workOrder?: string; jobDescription?: string }) => void;
}

const methodOptions = [
  "Close (Normal Operation)",
  "Close and LOTO",
  "Close and Tag Only",
  "Remove Earth (Normal Operation)",
  "Earth",
  "Insert Blind",
  "Off and LOTO",
  "Off and Tag Only",
  "Open (Normal Operation)",
  "Open and LOTO",
  "Open and Tag Only",
  "Remove Blind (Normal Operation)",
  "Rack-In (Normal Operation)",
  "Rack-Out and LOTO"
];

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'electrical': return 'bg-red-100 text-red-800 border-red-200';
    case 'mechanical': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'hydraulic': return 'bg-green-100 text-green-800 border-green-200';
    case 'pneumatic': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ListBuilder({
  currentList,
  savedLists,
  onRemoveFromList,
  onReorderList,
  onUpdateIsolationMethod,
  onClose,
  onExport,
}: ListBuilderProps) {
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [jsaNumber, setJsaNumber] = useState("");
  const [workOrder, setWorkOrder] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingMethodId, setEditingMethodId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save list mutation
  const saveListMutation = useMutation({
    mutationFn: async (listData: InsertSavedList) => {
      const response = await apiRequest("POST", "/api/saved-lists", listData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-lists"] });
      toast({
        title: "List Saved",
        description: "Your isolation list has been saved successfully.",
      });
      setListName("");
      setListDescription("");
      setJsaNumber("");
      setWorkOrder("");
      setJobDescription("");
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save the isolation list.",
        variant: "destructive",
      });
    },
  });

  // PDF export mutation
  const pdfExportMutation = useMutation({
    mutationFn: async (exportData: { isolationPointIds?: number[]; isolationPointsList?: IsolationPoint[]; jsaNumber?: string; workOrder?: string; jobDescription?: string; listName?: string }) => {
      const response = await apiRequest("POST", "/api/export/isolation-list-pdf", exportData);
      return response.json();
    },
    onSuccess: (data) => {
      generateLOTOPDF(data);
      toast({
        title: "PDF Generated",
        description: "Enterprise LOTO procedure PDF has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "PDF Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveList = () => {
    if (!listName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the list.",
        variant: "destructive",
      });
      return;
    }

    if (currentList.length === 0) {
      toast({
        title: "Empty List",
        description: "Cannot save an empty list.",
        variant: "destructive",
      });
      return;
    }

    const listData: InsertSavedList = {
      name: listName.trim(),
      description: listDescription.trim() || undefined,
      isolationPointIds: currentList.map(point => point.id),
      jsaNumber: jsaNumber.trim() || undefined,
      workOrder: workOrder.trim() || undefined,
      jobDescription: jobDescription.trim() || undefined,
    };

    saveListMutation.mutate(listData);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newList = [...currentList];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(index, 0, draggedItem);
    
    onReorderList(newList);
    setDraggedIndex(index);
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= currentList.length) return;

    const newList = [...currentList];
    const item = newList[fromIndex];
    newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, item);
    onReorderList(newList);
  };

  const clearList = () => {
    currentList.forEach(point => onRemoveFromList(point.id));
    toast({
      title: "List Cleared",
      description: "All items have been removed from the list.",
    });
  };

  return (
    <aside className="w-full lg:w-96 bg-white shadow-lg border-l border-border flex flex-col h-screen lg:h-full">
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">LOTO List Builder</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden touch-manipulation">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <Input
            placeholder="Enter list name..."
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
          <Textarea
            placeholder="List description (optional)..."
            value={listDescription}
            onChange={(e) => setListDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Input
            placeholder="JSA Number (optional)..."
            value={jsaNumber}
            onChange={(e) => setJsaNumber(e.target.value)}
          />
          <Input
            placeholder="Work Order (optional)..."
            value={workOrder}
            onChange={(e) => setWorkOrder(e.target.value)}
          />
          <Textarea
            placeholder="Job Description (optional)..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="space-y-2">
            <Button
              onClick={handleSaveList}
              disabled={saveListMutation.isPending || !listName.trim() || currentList.length === 0}
              className="w-full bg-safety-green hover:bg-safety-green/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save List
            </Button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={() => onExport({ listName, jsaNumber, workOrder, jobDescription })}
                disabled={currentList.length === 0}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              
              <Button
                onClick={() => {
                  pdfExportMutation.mutate({
                    isolationPointsList: currentList,
                    listName: listName || 'LOTO Procedure',
                    jsaNumber,
                    workOrder,
                    jobDescription
                  });
                }}
                disabled={currentList.length === 0 || pdfExportMutation.isPending}
                variant="outline"
                className="flex-1 bg-industrial-blue text-white hover:bg-industrial-blue/90"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Current List */}
      <div style={{ height: 'calc(100vh - 200px)' }} className="flex flex-col">
        <div className="p-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Current List</h3>
            <span className="text-xs text-muted-foreground">
              {currentList.length} item{currentList.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-scroll px-2 py-2" style={{ minHeight: 0 }}>
          {currentList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground text-sm">
                No isolation points in list
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Add points from the table to build your LOTO procedure
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-8">
              {currentList.map((point, index) => (
                <Card
                key={`${point.id}-${index}`}
                className={`draggable-item cursor-move hover:shadow-md transition-all ${
                  draggedIndex === index ? 'dragging opacity-50' : ''
                }`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
              >
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-start justify-between touch-manipulation">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 touch-manipulation" />
                        <span className="text-xs sm:text-sm font-medium text-industrial-blue font-mono">
                          {point.kks || ''}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 pl-6">
                        {point.description || ''}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground pl-6">
                        <span>Unit: {point.unit || ''}</span>
                        <div className="flex items-center space-x-2">
                          <span>Method:</span>
                          {editingMethodId === point.id ? (
                            <div className="flex items-center space-x-2">
                              <Select 
                                value={point.isolationMethod || ''} 
                                onValueChange={(value) => {
                                  onUpdateIsolationMethod(point.id, value);
                                  setEditingMethodId(null);
                                }}
                                open={true}
                              >
                                <SelectTrigger className="w-52 h-7 text-xs border-blue-300 bg-blue-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {methodOptions.map(method => (
                                    <SelectItem key={method} value={method} className="text-xs">
                                      {method}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMethodId(null)}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                title="Cancel editing"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-foreground font-medium bg-muted px-2 py-1 rounded text-xs">
                                {point.isolationMethod}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingMethodId(point.id)}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                                title="Edit isolation method"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFromList(point.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === currentList.length - 1}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* List Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Sequence matters for LOTO procedures</span>
        </div>
        
        <Button
          onClick={() => onExport({ listName: listName || undefined, jsaNumber: jsaNumber || undefined, workOrder: workOrder || undefined, jobDescription: jobDescription || undefined })}
          disabled={currentList.length === 0}
          className="w-full bg-industrial-blue hover:bg-industrial-blue/90 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate LOTO Procedure
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => onExport({ listName: listName || undefined, jsaNumber: jsaNumber || undefined, workOrder: workOrder || undefined, jobDescription: jobDescription || undefined })}
            disabled={currentList.length === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            disabled={currentList.length === 0}
            className="flex-1 bg-safety-orange hover:bg-safety-orange/90 text-white border-safety-orange"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={clearList}
          disabled={currentList.length === 0}
          className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear List
        </Button>
      </div>
    </aside>
  );
}
