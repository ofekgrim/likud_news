'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryElection } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ElectionStatus = PrimaryElection['status'];

function getStatusBadge(status: ElectionStatus): {
  variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  label: string;
} {
  switch (status) {
    case 'draft':
      return { variant: 'outline', label: 'טיוטה' };
    case 'upcoming':
      return { variant: 'secondary', label: 'עתידיות' };
    case 'active':
      return { variant: 'success', label: 'פעילות' };
    case 'voting':
      return { variant: 'warning', label: 'הצבעה' };
    case 'completed':
      return { variant: 'default', label: 'הושלמו' };
    case 'cancelled':
      return { variant: 'destructive', label: 'בוטלו' };
    default:
      return { variant: 'outline', label: status };
  }
}

export default function ElectionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: electionsRes, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections?isActive=true'),
  });
  const elections = electionsRes?.data;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/elections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      toast.success('הבחירות נמחקו בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(id: string, title: string) {
    if (window.confirm(`למחוק את "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  }

  const filteredElections = useMemo(() => {
    if (!elections) return [];
    if (!searchQuery.trim()) return elections;
    const q = searchQuery.trim().toLowerCase();
    return elections.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.titleEn && e.titleEn.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }, [elections, searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">בחירות ראשוניות</h1>
        <Button onClick={() => router.push('/primaries/elections/new')}>
          בחירות חדשות +
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי כותרת..."
          className="pr-10"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium">תאריך</th>
              <th className="text-right px-4 py-3 font-medium">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium">פעיל</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))
            ) : filteredElections.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery.trim()
                    ? 'לא נמצאו בחירות התואמות את החיפוש.'
                    : 'אין בחירות. צור בחירות חדשות כדי להתחיל.'}
                </td>
              </tr>
            ) : (
              filteredElections.map((election) => {
                const statusBadge = getStatusBadge(election.status);
                return (
                  <tr
                    key={election.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium">{election.title}</td>
                    <td className="px-4 py-3.5 text-gray-600" dir="ltr">
                      {election.electionDate
                        ? format(new Date(election.electionDate), 'dd/MM/yyyy')
                        : '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={election.isActive ? 'success' : 'outline'}>
                        {election.isActive ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/primaries/elections/${election.id}/edit`
                            )
                          }
                        >
                          עריכה
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() =>
                            handleDelete(election.id, election.title)
                          }
                          disabled={deleteMutation.isPending}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
