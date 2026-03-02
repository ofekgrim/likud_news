'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryCandidate } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { User } from 'lucide-react';

interface CandidateSelectorProps {
  value: string | undefined;
  onChange: (candidateId: string | undefined) => void;
  electionId?: string;
  label?: string;
}

export function CandidateSelector({ value, onChange, electionId, label = 'מועמד' }: CandidateSelectorProps) {
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates', electionId],
    queryFn: async () => {
      if (electionId) {
        return api.get<PrimaryCandidate[]>(`/candidates/election/${electionId}`);
      }
      const res = await api.get<{ data: PrimaryCandidate[] }>('/candidates');
      return res.data;
    },
    enabled: true,
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? 'טוען...' : 'בחר מועמד'}
        </option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.fullName} {c.district ? `(${c.district})` : ''}
          </option>
        ))}
      </Select>
      {value && candidates.length > 0 && (() => {
        const selected = candidates.find((c) => c.id === value);
        if (!selected) return null;
        return (
          <div className="flex items-center gap-2 mt-1.5 p-2 bg-gray-50 rounded-md">
            {selected.photoUrl ? (
              <img src={selected.photoUrl} alt={selected.fullName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium">{selected.fullName}</p>
              {selected.district && <p className="text-[10px] text-gray-500">{selected.district}</p>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
