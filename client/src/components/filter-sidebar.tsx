import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FilterOptions, SavedList } from "@shared/schema";

interface FilterSidebarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  savedLists: SavedList[];
  onLoadList: (list: SavedList) => void;
}

const unitOptions = [
  { value: "Unit 1", label: "Unit 1 - Primary Reactor", count: 45 },
  { value: "Unit 2", label: "Unit 2 - Secondary Systems", count: 32 },
  { value: "Unit 3", label: "Unit 3 - Cooling Systems", count: 28 },
  { value: "Unit 4", label: "Unit 4 - Auxiliary", count: 15 },
];

const typeOptions = [
  { value: "Electrical", label: "Electrical", count: 67, color: "bg-red-500" },
  { value: "Mechanical", label: "Mechanical", count: 23, color: "bg-blue-500" },
  { value: "Hydraulic", label: "Hydraulic", count: 18, color: "bg-green-500" },
  { value: "Pneumatic", label: "Pneumatic", count: 15, color: "bg-yellow-500" },
];

const methodOptions = [
  { value: "Circuit Breaker", label: "Circuit Breaker", count: 42 },
  { value: "Motor Operated Valve", label: "Motor Operated Valve", count: 31 },
  { value: "Manual Valve", label: "Manual Valve", count: 18 },
  { value: "Disconnect Switch", label: "Disconnect Switch", count: 16 },
  { value: "Manual Isolation", label: "Manual Isolation", count: 12 },
];

const positionOptions = [
  { value: "Open", label: "Open", count: 34 },
  { value: "Closed", label: "Closed", count: 28 },
  { value: "Energized", label: "Energized", count: 24 },
  { value: "De-energized", label: "De-energized", count: 19 },
];

export default function FilterSidebar({
  filters,
  onFilterChange,
  savedLists,
  onLoadList,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState({
    units: true,
    types: true,
    methods: false,
    positions: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleFilterToggle = (filterType: keyof FilterOptions, value: string) => {
    const currentValues = (filters[filterType] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({
      ...filters,
      [filterType]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterOptions];
    return Array.isArray(value) ? value.length > 0 : !!value;
  });

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-border overflow-y-auto scrollbar-thin">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Advanced Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Units Filter */}
        <Collapsible
          open={openSections.units}
          onOpenChange={() => toggleSection('units')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium">Unit</span>
              {openSections.units ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {unitOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={(filters.units || []).includes(option.value)}
                  onCheckedChange={() => handleFilterToggle('units', option.value)}
                />
                <span className="text-sm flex-1">{option.label}</span>
                <span className="text-xs text-muted-foreground">({option.count})</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Types Filter */}
        <Collapsible
          open={openSections.types}
          onOpenChange={() => toggleSection('types')}
          className="mt-6"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium">Isolation Type</span>
              {openSections.types ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {typeOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={(filters.types || []).includes(option.value)}
                  onCheckedChange={() => handleFilterToggle('types', option.value)}
                />
                <span className="text-sm flex items-center flex-1">
                  <span className={`w-3 h-3 ${option.color} rounded-full mr-2`}></span>
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground">({option.count})</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Methods Filter */}
        <Collapsible
          open={openSections.methods}
          onOpenChange={() => toggleSection('methods')}
          className="mt-6"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium">Isolation Method</span>
              {openSections.methods ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {methodOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={(filters.methods || []).includes(option.value)}
                  onCheckedChange={() => handleFilterToggle('methods', option.value)}
                />
                <span className="text-sm flex-1">{option.label}</span>
                <span className="text-xs text-muted-foreground">({option.count})</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Positions Filter */}
        <Collapsible
          open={openSections.positions}
          onOpenChange={() => toggleSection('positions')}
          className="mt-6"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium">Normal Position</span>
              {openSections.positions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {positionOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={(filters.positions || []).includes(option.value)}
                  onCheckedChange={() => handleFilterToggle('positions', option.value)}
                />
                <span className="text-sm flex-1">{option.label}</span>
                <span className="text-xs text-muted-foreground">({option.count})</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Saved Lists Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Saved Lists & Presets</h3>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        <div className="space-y-2">
          {savedLists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onLoadList(list)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {list.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {list.isolationPointIds.length} isolation points
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <div className={`w-3 h-3 rounded-full ${
                      list.name.includes('Emergency') ? 'bg-caution-amber' :
                      list.name.includes('Unit 1') ? 'bg-safety-green' :
                      'bg-industrial-blue'
                    }`}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </aside>
  );
}
