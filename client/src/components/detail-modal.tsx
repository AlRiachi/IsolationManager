import { AlertTriangle, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IsolationPoint } from "@shared/schema";

interface DetailModalProps {
  point: IsolationPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (point: IsolationPoint) => void;
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

const getPositionColor = (position: string) => {
  switch (position.toLowerCase()) {
    case 'open': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-red-100 text-red-800';
    case 'energized': return 'bg-green-100 text-green-800';
    case 'de-energized': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function DetailModal({
  point,
  isOpen,
  onClose,
  onAddToList,
}: DetailModalProps) {
  if (!point) return null;

  const handleAddToList = () => {
    onAddToList(point);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Isolation Point Details</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                KKS Code
              </label>
              <div className="text-sm text-industrial-blue font-medium font-mono">
                {point.kks}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Unit
              </label>
              <div className="text-sm text-foreground">{point.unit}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Description
            </label>
            <div className="text-sm text-foreground">{point.description}</div>
          </div>

          {/* Type and Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Isolation Type
              </label>
              <Badge variant="outline" className={getTypeColor(point.type)}>
                <span className="w-2 h-2 bg-current rounded-full mr-1.5"></span>
                {point.type}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Isolation Method
              </label>
              <div className="text-sm text-foreground">{point.isolationMethod}</div>
            </div>
          </div>

          {/* KKS References */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Panel KKS
              </label>
              <div className="text-sm text-foreground font-mono">
                {point.panelKks || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Load KKS
              </label>
              <div className="text-sm text-foreground font-mono">
                {point.loadKks || '-'}
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Normal Position
              </label>
              <Badge variant="outline" className={getPositionColor(point.normalPosition)}>
                {point.normalPosition}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Isolation Position
              </label>
              <div className="text-sm text-foreground">
                {point.isolationPosition || 'Not specified'}
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {point.specialInstructions && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Special Instructions
              </label>
              <div className="text-sm text-foreground bg-caution-amber/10 p-3 rounded-lg border border-caution-amber/20">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-caution-amber flex-shrink-0 mt-0.5" />
                  <div>{point.specialInstructions}</div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            Created: {new Date(point.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleAddToList}
            className="bg-industrial-blue hover:bg-industrial-blue/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
