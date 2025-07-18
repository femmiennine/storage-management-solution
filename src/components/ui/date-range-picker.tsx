"use client";

import { Calendar } from 'lucide-react';
import { Button } from './button';

interface DatePickerWithRangeProps {
  date?: {
    from: Date;
    to: Date;
  };
  onSelect?: (range: { from: Date; to: Date } | undefined) => void;
}

export function DatePickerWithRange({ date, onSelect }: DatePickerWithRangeProps) {
  // Simplified date range picker - in production you'd use a proper date picker library
  return (
    <Button variant="outline" className="justify-start text-left font-normal">
      <Calendar className="mr-2 h-4 w-4" />
      {date ? (
        `${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}`
      ) : (
        <span>Pick a date range</span>
      )}
    </Button>
  );
}