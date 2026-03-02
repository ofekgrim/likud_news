'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Trash2, Pin, XCircle } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  textEn?: string;
  voteCount: number;
}

interface CommunityPoll {
  id: string;
  question: string;
  questionEn?: string;
  options: PollOption[];
  totalVotes: number;
  isPinned: boolean;
  isActive: boolean;
  closesAt?: string;
  createdAt: string;
}

export default function PollsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: polls, isLoading } = useQuery({
    queryKey: ['community-polls'],
    queryFn: () => api.get<CommunityPoll[]>('/community-polls'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/community-polls/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-polls'] });
      toast.success('הסקר נמחק בהצלחה');
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeleteId(null);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/community-polls/${id}`, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-polls'] });
      toast.success('הסקר נסגר בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sortedPolls = useMemo(() => {
    if (!polls) return [];
    return [...polls].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [polls]);

  function handleDelete(id: string) {
    if (deleteId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteId(id);
      setTimeout(() => setDeleteId(null), 3000);
    }
  }

  function getOptionBarWidth(option: PollOption, totalVotes: number): string {
    if (totalVotes === 0) return '0%';
    return `${Math.round((option.voteCount / totalVotes) * 100)}%`;
  }

  const OPTION_COLORS = ['#0099DB', '#1E3A8A', '#38BDF8', '#6366F1', '#EC4899', '#F59E0B'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">סקרים קהילתיים</h1>
        <Button onClick={() => router.push('/primaries/polls/new')}>
          סקר חדש +
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">שאלה</th>
              <th className="text-right px-4 py-3 font-medium">אפשרויות</th>
              <th className="text-right px-4 py-3 font-medium">הצבעות</th>
              <th className="text-right px-4 py-3 font-medium">תוצאות</th>
              <th className="text-right px-4 py-3 font-medium">מוצמד</th>
              <th className="text-right px-4 py-3 font-medium">פעיל</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))
            ) : sortedPolls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  אין סקרים. צור סקר חדש כדי להתחיל.
                </td>
              </tr>
            ) : (
              sortedPolls.map((poll) => (
                <tr
                  key={poll.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5 font-medium max-w-[250px]">
                    <p className="truncate">{poll.question}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {poll.options.length}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {poll.totalVotes.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 min-w-[180px]">
                    <div className="space-y-1">
                      {poll.options.map((option, idx) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 w-16 truncate">
                            {option.text}
                          </span>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: getOptionBarWidth(option, poll.totalVotes),
                                backgroundColor: OPTION_COLORS[idx % OPTION_COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 w-8 text-left" dir="ltr">
                            {poll.totalVotes > 0
                              ? `${Math.round((option.voteCount / poll.totalVotes) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {poll.isPinned ? (
                      <Badge variant="secondary">
                        <Pin className="h-3 w-3 ml-1" />
                        מוצמד
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={poll.isActive ? 'success' : 'outline'}>
                      {poll.isActive ? 'פעיל' : 'סגור'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/primaries/polls/${poll.id}/edit`)
                        }
                      >
                        עריכה
                      </Button>
                      {poll.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                          onClick={() => closeMutation.mutate(poll.id)}
                          disabled={closeMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 ml-1" />
                          סגור סקר
                        </Button>
                      )}
                      <Button
                        variant={deleteId === poll.id ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleDelete(poll.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteId === poll.id ? (
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
