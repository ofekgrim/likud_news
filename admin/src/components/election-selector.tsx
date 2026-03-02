'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryElection } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface ElectionSelectorProps {
  value: string | undefined;
  onChange: (electionId: string) => void;
  label?: string;
  required?: boolean;
}

export function ElectionSelector({ value, onChange, label = 'בחירות', required }: ElectionSelectorProps) {
  const { data: electionsRes, isLoading } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  return (
    <div className="space-y-2">
      <Label>{label}{required && ' *'}</Label>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        required={required}
      >
        <option value="">
          {isLoading ? 'טוען...' : 'בחר בחירות'}
        </option>
        {elections.map((el) => (
          <option key={el.id} value={el.id}>
            {el.title} ({el.status})
          </option>
        ))}
      </Select>
    </div>
  );
}
