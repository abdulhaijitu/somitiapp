import { useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  from: Date | undefined;
  to: Date | undefined;
  onRangeChange: (from: Date | undefined, to: Date | undefined) => void;
}

const presets = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Last 3 months', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { label: 'This year', getValue: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }) },
];

export function DateRangeFilter({ from, to, onRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handlePresetChange = (value: string) => {
    if (value === 'all') {
      onRangeChange(undefined, undefined);
      return;
    }
    const preset = presets.find(p => p.label === value);
    if (preset) {
      const { from, to } = preset.getValue();
      onRangeChange(from, to);
    }
  };

  const displayValue = () => {
    if (!from && !to) return 'All time';
    if (from && to) {
      return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
    }
    if (from) return `From ${format(from, 'MMM d, yyyy')}`;
    if (to) return `To ${format(to, 'MMM d, yyyy')}`;
    return 'Select date range';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal gap-2",
            !from && !to && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {displayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quick select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              {presets.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex p-3 gap-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">From</p>
            <Calendar
              mode="single"
              selected={from}
              onSelect={(date) => onRangeChange(date, to)}
              initialFocus
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">To</p>
            <Calendar
              mode="single"
              selected={to}
              onSelect={(date) => onRangeChange(from, date)}
            />
          </div>
        </div>
        <div className="p-3 border-t border-border flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onRangeChange(undefined, undefined)}
          >
            Clear
          </Button>
          <Button 
            size="sm"
            onClick={() => setOpen(false)}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
