import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { FiltersModal } from "./FiltersModal";

interface SearchFiltersProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  categories: string[];
  initialSearchTerm?: string;
  initialCategory?: string;
}

export const SearchFilters = ({
  onSearchChange,
  onCategoryChange,
  onLocationChange,
  categories,
  initialSearchTerm = "",
  initialCategory = "all",
}: SearchFiltersProps) => {
  const [search, setSearch] = useState(initialSearchTerm);

  useEffect(() => {
    setSearch(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(search);
  };

  return (
    <Card className="p-6 mb-6 shadow-lg border-2 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-muted/30">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Filter className="h-5 w-5" />
          Search & Filters
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-2 shadow-sm hover:shadow-md focus:shadow-lg focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500/20 transition-all duration-200"
            />
          </form>
        </div>
        
        <div className="flex gap-2">
          <FiltersModal
            onSearchChange={onSearchChange}
            onCategoryChange={onCategoryChange}
            onLocationChange={onLocationChange}
            categories={categories}
            initialSearchTerm={initialSearchTerm}
            initialCategory={initialCategory}
          >
            <Button 
              type="button" 
              variant="outline"
              className="border-2 shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </FiltersModal>
          
          <Button 
            type="button" 
            onClick={() => handleSearchSubmit(new Event('submit') as any)}
            className="shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            Search
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="border-2 shadow-md hover:shadow-lg transition-shadow duration-200"
            onClick={() => {
              setSearch("");
              onSearchChange("");
              onLocationChange("");
              onCategoryChange("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </Card>
  );
};