import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, Edit, Trash2, Upload, Download, Save, X, 
  AlertCircle, CheckCircle, Database, FileUp, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import type { IsolationPoint, InsertIsolationPoint } from "@shared/schema";
import { insertIsolationPointSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const formSchema = insertIsolationPointSchema.extend({
  kks: z.string().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  isolationMethod: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const typeOptions = ["Electrical", "Mechanical", "Hydraulic", "Pneumatic"];
const unitOptions = ["Unit 1", "Unit 2", "Unit 3", "Unit 4"];
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
const positionOptions = ["Open", "Closed", "Energized", "De-energized", "Normal", "Isolated"];

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'electrical': return 'bg-red-100 text-red-800 border-red-200';
    case 'mechanical': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'hydraulic': return 'bg-green-100 text-green-800 border-green-200';
    case 'pneumatic': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function IsolationPointsManagement() {
  const [editingPoint, setEditingPoint] = useState<IsolationPoint | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kks: "",
      unit: "",
      description: "",
      type: "",
      panelKks: "",
      loadKks: "",
      isolationMethod: "",
      normalPosition: "",
      isolationPosition: "",
      specialInstructions: "",
    },
  });

  // Fetch isolation points
  const { data: isolationPoints = [], isLoading } = useQuery<IsolationPoint[]>({
    queryKey: ["/api/isolation-points"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertIsolationPoint) => {
      const response = await apiRequest("POST", "/api/isolation-points", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isolation-points"] });
      toast({
        title: "Point Created",
        description: "Isolation point has been created successfully.",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create isolation point.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertIsolationPoint> }) => {
      const response = await apiRequest("PUT", `/api/isolation-points/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isolation-points"] });
      toast({
        title: "Point Updated",
        description: "Isolation point has been updated successfully.",
      });
      setEditingPoint(null);
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update isolation point.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/isolation-points/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/isolation-points"] });
      toast({
        title: "Point Deleted",
        description: "Isolation point has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete isolation point.",
        variant: "destructive",
      });
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (points: InsertIsolationPoint[]) => {
      const results = [];
      for (const point of points) {
        try {
          const response = await apiRequest("POST", "/api/isolation-points", point);
          results.push({ success: true, point, data: response });
        } catch (error: any) {
          results.push({ success: false, point, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ["/api/isolation-points"] });
      
      if (errorCount === 0) {
        toast({
          title: "Import Successful",
          description: `${successCount} isolation points imported successfully.`,
        });
      } else {
        toast({
          title: "Import Completed with Errors",
          description: `${successCount} points imported, ${errorCount} failed.`,
          variant: "destructive",
        });
      }
      
      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview([]);
      setImportErrors([]);
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import isolation points.",
        variant: "destructive",
      });
    },
  });

  // CSV parsing function
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    const errors = [];
    
    // Expected headers (simplified)
    const expectedHeaders = ['kks', 'unit', 'description', 'type', 'isolationMethod'];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Validate required fields
      try {
        const validatedRow = {
          kks: row.kks || '',
          unit: row.unit || '',
          description: row.description || '',
          type: row.type || '',
          isolationMethod: row.isolationMethod || '',
          normalPosition: row.normalPosition || 'Unknown',
          panelKks: row.panelKks || null,
          loadKks: row.loadKks || null,
          isolationPosition: row.isolationPosition || null,
          specialInstructions: row.specialInstructions || null,
        };
        
        // Basic validation - only check for completely empty rows
        if (!validatedRow.kks && !validatedRow.unit && !validatedRow.description && !validatedRow.type && !validatedRow.isolationMethod) {
          throw new Error('Row is completely empty');
        }
        
        data.push(validatedRow);
      } catch (error: any) {
        errors.push(`Row ${i}: ${error.message}`);
      }
    }
    
    return { data, errors };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }
    
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data, errors } = parseCSV(text);
        setImportPreview(data);
        setImportErrors(errors);
      } catch (error: any) {
        toast({
          title: "Parse Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (importPreview.length === 0) return;
    bulkImportMutation.mutate(importPreview);
  };

  const downloadTemplate = () => {
    const headers = ['kks', 'unit', 'description', 'type', 'isolationMethod'];
    const sampleData = [
      '1AAA01AA001,Unit 1,Main Feed Water Pump Motor,Electrical,Open and LOTO'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'isolation_points_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (point: IsolationPoint) => {
    setEditingPoint(point);
    form.reset({
      kks: point.kks,
      unit: point.unit,
      description: point.description,
      type: point.type,
      panelKks: point.panelKks || "",
      loadKks: point.loadKks || "",
      isolationMethod: point.isolationMethod,
      normalPosition: point.normalPosition,
      isolationPosition: point.isolationPosition || "",
      specialInstructions: point.specialInstructions || "",
    });
    setShowForm(true);
  };

  const handleDelete = (point: IsolationPoint) => {
    if (confirm(`Are you sure you want to delete "${point.kks}"? This action cannot be undone.`)) {
      deleteMutation.mutate(point.id);
    }
  };

  const onSubmit = (data: FormData) => {
    if (editingPoint) {
      updateMutation.mutate({ id: editingPoint.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPoint(null);
    form.reset();
  };

  const handleExportTemplate = () => {
    const csvTemplate = [
      "kks,unit,description,type,isolationMethod",
      "1AAA01AA001,Unit 1,Sample Description,Electrical,Open and LOTO"
    ].join('\n');
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'isolation-points-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded with simplified format. Fill it out and upload to bulk import points.",
    });
  };

  // Filter points based on search and filters
  const filteredPoints = isolationPoints.filter(point => {
    const matchesSearch = !searchTerm || 
      point.kks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.unit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || point.type === selectedType;
    const matchesUnit = !selectedUnit || point.unit === selectedUnit;
    
    return matchesSearch && matchesType && matchesUnit;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Database className="h-6 w-6 text-industrial-blue" />
                <h1 className="text-xl font-bold text-foreground">Isolation Points Management</h1>
              </div>
              <div className="text-sm text-muted-foreground">Database Administration</div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button
                  variant="outline"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to LOTO
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="text-muted-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="text-muted-foreground"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-industrial-blue hover:bg-industrial-blue/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Point
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-industrial-blue rounded-full"></div>
                <div className="text-sm font-medium">Total Points</div>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {isolationPoints.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="text-sm font-medium">Electrical</div>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {isolationPoints.filter(p => p.type === 'Electrical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm font-medium">Mechanical</div>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {isolationPoints.filter(p => p.type === 'Mechanical').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-safety-green rounded-full"></div>
                <div className="text-sm font-medium">Critical</div>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">
                {isolationPoints.filter(p => p.specialInstructions?.includes('Critical') || p.specialInstructions?.includes('Emergency')).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by KKS, description, or unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedUnit || "all"} onValueChange={(value) => setSelectedUnit(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {unitOptions.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || selectedType || selectedUnit) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("");
                    setSelectedUnit("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Points List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Isolation Points ({filteredPoints.length})</span>
              <div className="text-sm font-normal text-muted-foreground">
                Manage isolation point database
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading isolation points...
              </div>
            ) : filteredPoints.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No isolation points found matching your filters.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredPoints.map((point) => (
                  <div key={point.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-industrial-blue font-mono">
                            {point.kks}
                          </span>
                          <Badge variant="outline" className={getTypeColor(point.type)}>
                            <span className="w-1.5 h-1.5 bg-current rounded-full mr-1"></span>
                            {point.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{point.unit}</span>
                        </div>
                        <div className="text-sm text-foreground mb-1">{point.description}</div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Method: {point.isolationMethod}</span>
                          <span>Position: {point.normalPosition}</span>
                          {point.panelKks && <span>Panel: {point.panelKks}</span>}
                        </div>
                        {point.specialInstructions && (
                          <div className="mt-2 text-xs text-caution-amber flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Special instructions required</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(point)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(point)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{editingPoint ? 'Edit' : 'Add New'} Isolation Point</span>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Required Fields */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-foreground border-b border-border pb-2">
                  Required Information
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="kks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <span>KKS Code</span>
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1AAA01AA001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <span>Unit</span>
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitOptions.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <span>Description</span>
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Primary Coolant Pump Motor Breaker" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <span>Isolation Type</span>
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {typeOptions.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isolationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <span>Isolation Method</span>
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {methodOptions.map(method => (
                              <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-foreground border-b border-border pb-2">
                  Optional Information
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="panelKks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel KKS</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1AAA01AB001" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loadKks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load KKS</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1AAA01AC001" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any special safety instructions or procedures..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-industrial-blue hover:bg-industrial-blue/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingPoint ? 'Update' : 'Create'} Point
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Bulk Import Isolation Points</span>
              <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Import Instructions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Upload a CSV file with isolation point data</li>
                <li>• Required columns: kks, unit, description, type, isolationMethod, normalPosition</li>
                <li>• Optional columns: panelKks, loadKks, isolationPosition, specialInstructions</li>
                <li>• Download the template below for the correct format</li>
              </ul>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template</span>
                </Button>
                <div className="text-sm text-muted-foreground">
                  Download the CSV template to ensure correct formatting
                </div>
              </div>
              
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Click to upload CSV file or drag and drop
                  </div>
                  {importFile && (
                    <div className="text-sm font-medium text-foreground">
                      Selected: {importFile.name}
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Import Errors */}
            {importErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-medium text-destructive mb-2">Validation Errors</h4>
                <div className="text-sm text-destructive space-y-1 max-h-32 overflow-y-auto">
                  {importErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Preview ({importPreview.length} points)</h4>
                <div className="border rounded-lg max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">KKS</th>
                        <th className="text-left p-2 font-medium">Unit</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Method</th>
                        <th className="text-left p-2 font-medium">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 10).map((point, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-mono text-xs">{point.kks}</td>
                          <td className="p-2">{point.unit}</td>
                          <td className="p-2 truncate max-w-48">{point.description}</td>
                          <td className="p-2">{point.type}</td>
                          <td className="p-2 truncate max-w-32">{point.isolationMethod}</td>
                          <td className="p-2">{point.normalPosition}</td>
                        </tr>
                      ))}
                      {importPreview.length > 10 && (
                        <tr className="border-t">
                          <td colSpan={6} className="p-2 text-center text-muted-foreground">
                            ... and {importPreview.length - 10} more points
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importPreview.length === 0 || importErrors.length > 0 || bulkImportMutation.isPending}
                className="bg-industrial-blue hover:bg-industrial-blue/90 text-white"
              >
                {bulkImportMutation.isPending ? (
                  <>Importing...</>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    Import {importPreview.length} Points
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}