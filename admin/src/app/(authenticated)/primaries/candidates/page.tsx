'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryCandidate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';

export default function CandidatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [electionFilter, setElectionFilter] = useState<string | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryKey = electionFilter
    ? ['candidates', 'election', electionFilter]
    : ['candidates'];

  const { data: candidates, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (electionFilter) {
        return api.get<PrimaryCandidate[]>(`/candidates/election/${electionFilter}`);
      }
      const res = await api.get<{ data: PrimaryCandidate[] }>('/candidates');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('המועמד נמחק בהצלחה');
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeleteId(null);
    },
  });

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.district && c.district.toLowerCase().includes(q))
    );
  }, [candidates, searchQuery]);

  function getInitial(name?: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  function handleDelete(id: string) {
    if (deleteId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteId(id);
      setTimeout(() => setDeleteId(null), 3000);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">מועמדים</h1>
        <Button onClick={() => router.push('/primaries/candidates/new')}>
          מועמד חדש +
        </Button>
      </div>

      {/* Election Filter */}
      <div className="mb-4">
        <ElectionSelector
          value={electionFilter}
          onChange={(val) => setElectionFilter(val)}
          label="סינון לפי בחירות"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם או מחוז..."
          className="pr-10"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תמונה</th>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">מחוז</th>
              <th className="text-right px-4 py-3 font-medium">תמיכות</th>
              <th className="text-right px-4 py-3 font-medium">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery.trim()
                    ? 'לא נמצאו מועמדים התואמים את החיפוש.'
                    : 'אין מועמדים. צור מועמד חדש כדי להתחיל.'}
                </td>
              </tr>
            ) : (
              filteredCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    {candidate.photoUrl ? (
                      <img
                        src={candidate.photoUrl}
                        alt={candidate.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-semibold text-sm">
                        {getInitial(candidate.fullName)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{candidate.fullName || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {candidate.district || '-'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {candidate.endorsementCount}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={candidate.isActive ? 'success' : 'outline'}>
                      {candidate.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/primaries/candidates/${candidate.id}/edit`
                          )
                        }
                      >
                        עריכה
                      </Button>
                      <Button
                        variant={deleteId === candidate.id ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleDelete(candidate.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteId === candidate.id ? (
                          'לחץ שוב לאישור'
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
