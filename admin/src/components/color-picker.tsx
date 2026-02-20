'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { value: '#E53935', label: 'אדום' },
  { value: '#FF9800', label: 'כתום' },
  { value: '#4CAF50', label: 'ירוק' },
  { value: '#2196F3', label: 'כחול' },
  { value: '#9C27B0', label: 'סגול' },
  { value: '#000000', label: 'שחור' },
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      <div className="flex items-center gap-3">
        {/* HTML5 color input */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded-md border border-gray-200 cursor-pointer p-0.5"
          />
        </div>

        {/* Current value display */}
        <span className="text-xs font-mono text-gray-500 dir-ltr" dir="ltr">
          {value}
        </span>
      </div>

      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            title={preset.label}
            className={cn(
              'w-7 h-7 rounded-md border-2 transition-all hover:scale-110',
              value === preset.value
                ? 'border-gray-800 ring-2 ring-gray-300'
                : 'border-gray-200 hover:border-gray-400'
            )}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>
    </div>
  );
}
