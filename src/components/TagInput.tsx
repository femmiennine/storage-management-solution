"use client";

import { useState, useEffect, KeyboardEvent } from 'react';
import { X, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getSuggestedTags } from '@/lib/actions/tag.actions';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ 
  value = [], 
  onChange, 
  placeholder = "Add tags...",
  maxTags = 10 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 0) {
        const suggested = await getSuggestedTags(inputValue);
        setSuggestions(suggested);
        setShowSuggestions(suggested.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const selectSuggestion = (suggestion: string) => {
    addTag(suggestion);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            <Hash className="h-3 w-3" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : value.length < maxTags ? 'Add more...' : ''}
          className="flex-1 min-w-[120px] border-0 px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={value.length >= maxTags}
        />
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2 space-y-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-sm"
              >
                <Hash className="inline h-3 w-3 mr-1" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {value.length >= maxTags && (
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}