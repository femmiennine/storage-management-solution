"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Filter, Calendar, FileText, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { debounce } from '@/lib/utils';
import { TagInput } from '@/components/TagInput';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, filters: SearchFilters) => void;
  showFilters?: boolean;
}

export interface SearchFilters {
  types: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  folders?: string[];
  tags?: string[];
}

const fileTypeOptions = [
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'video', label: 'Videos', icon: '🎥' },
  { value: 'audio', label: 'Audio', icon: '🎵' },
  { value: 'document', label: 'Documents', icon: '📄' },
  { value: 'other', label: 'Other', icon: '📁' }
];

export function SearchBar({ 
  placeholder = "Search files and folders...", 
  onSearch,
  showFilters = true 
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: undefined,
    sizeRange: undefined,
    folders: [],
    tags: []
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Debounce search to avoid too many requests
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: SearchFilters) => {
      if (onSearch) {
        onSearch(searchQuery, searchFilters);
      }

      // Update URL params
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (searchFilters.types.length > 0) {
        params.set('types', searchFilters.types.join(','));
      }
      
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      router.push(newUrl);
    }, 300),
    [onSearch, router]
  );

  useEffect(() => {
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);

  const handleClearSearch = () => {
    setQuery('');
    setFilters({
      types: [],
      dateRange: undefined,
      sizeRange: undefined,
      folders: [],
      tags: []
    });
  };

  const toggleFileType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const activeFilterCount = 
    filters.types.length + 
    (filters.dateRange ? 1 : 0) + 
    (filters.sizeRange ? 1 : 0) + 
    (filters.folders?.length || 0) +
    (filters.tags?.length || 0);

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>File Types</DropdownMenuLabel>
              {fileTypeOptions.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.value}
                  checked={filters.types.includes(type.value)}
                  onCheckedChange={() => toggleFileType(type.value)}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Date Range</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setShowDatePicker(true)}
                className="cursor-pointer"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {filters.dateRange 
                  ? `${filters.dateRange.from.toLocaleDateString()} - ${filters.dateRange.to.toLocaleDateString()}`
                  : 'Select date range'
                }
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Tags</DropdownMenuLabel>
              <div className="px-2 py-2">
                <TagInput
                  value={filters.tags || []}
                  onChange={(tags) => setFilters(prev => ({ ...prev, tags }))}
                  placeholder="Filter by tags..."
                  maxTags={5}
                />
              </div>
              
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleClearSearch}
                    className="text-destructive cursor-pointer"
                  >
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map((type) => {
            const typeOption = fileTypeOptions.find(t => t.value === type);
            return (
              <Badge key={type} variant="secondary" className="gap-1">
                {typeOption?.icon} {typeOption?.label}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-3 w-3 ml-1"
                  onClick={() => toggleFileType(type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              📅 {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
              <Button
                size="icon"
                variant="ghost"
                className="h-3 w-3 ml-1"
                onClick={() => setFilters(prev => ({ ...prev, dateRange: undefined }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.tags && filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Hash className="h-3 w-3" />
              {tag}
              <Button
                size="icon"
                variant="ghost"
                className="h-3 w-3 ml-1"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  tags: prev.tags?.filter(t => t !== tag) || [] 
                }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}