import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, Save, FileText, Download, Share, Trash2, 
  GripVertical, ChevronUp, ChevronDown, Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { IsolationPoint, SavedList, InsertSavedList } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ListBuilderProps {
  currentList: IsolationPoint[];
  savedLists: SavedList[];
  onRemoveFromList: (pointId: number) => void;
  onReorderList: (newOrder: IsolationPoint[]) => void;
  onClose: () => void;
  onExport: () => void;
}

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
  onClose,
  onExport,
}: ListBuilderProps) {
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
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
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save the isolation list.",
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
    <aside className="w-96 bg-white shadow-lg border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">LOTO List Builder</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
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
          <Button
            onClick={handleSaveList}
            disabled={saveListMutation.isPending || !listName.trim() || currentList.length === 0}
            className="w-full bg-safety-green hover:bg-safety-green/90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save List
          </Button>
        </div>
      </div>

      {/* Current List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Current List</h3>
            <span className="text-xs text-muted-foreground">
              {currentList.length} item{currentList.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
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
            currentList.map((point, index) => (
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
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-industrial-blue font-mono">
                          {point.kks}
                        </span>
                        <Badge variant="outline" className={`${getTypeColor(point.type)} text-xs`}>
                          <span className="w-1.5 h-1.5 bg-current rounded-full mr-1"></span>
                          {point.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2 pl-6">
                        {point.description}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground pl-6">
                        <span>Unit: {point.unit}</span>
                        <span>Method: {point.isolationMethod}</span>
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
            ))
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
          onClick={onExport}
          disabled={currentList.length === 0}
          className="w-full bg-industrial-blue hover:bg-industrial-blue/90 text-white"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate LOTO Procedure
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onExport}
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
