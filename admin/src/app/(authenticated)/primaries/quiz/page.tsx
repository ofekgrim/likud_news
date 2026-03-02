'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PrimaryElection, QuizQuestion } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ClipboardList, Calendar } from 'lucide-react';

function getStatusBadge(status: PrimaryElection['status']): {
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

export default function QuizPage() {
  const router = useRouter();

  const { data: electionsRes, isLoading } = useQuery({
    queryKey: ['elections-all'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">שאלון התאמה</h1>
        <p className="text-sm text-gray-500 mt-1">
          בחר בחירות לניהול השאלון
        </p>
      </div>

      {/* Election Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : elections.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>אין בחירות. צור בחירות חדשות כדי להתחיל.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {elections.map((election) => {
            const statusBadge = getStatusBadge(election.status);
            return (
              <ElectionQuizCard
                key={election.id}
                election={election}
                statusBadge={statusBadge}
                onClick={() => router.push(`/primaries/quiz/${election.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ElectionQuizCard({
  election,
  statusBadge,
  onClick,
}: {
  election: PrimaryElection;
  statusBadge: { variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'; label: string };
  onClick: () => void;
}) {
  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', election.id],
    queryFn: () => api.get<QuizQuestion[]>(`/elections/${election.id}/quiz`),
  });

  const activeCount = questions.filter((q) => q.isActive).length;

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-[#0099DB]/40 transition-all"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{election.title}</CardTitle>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          {election.electionDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span dir="ltr">
                {format(new Date(election.electionDate), 'dd/MM/yyyy')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-gray-400" />
            <span>
              {questions.length} שאלות{' '}
              {activeCount < questions.length && (
                <span className="text-gray-400">
                  ({activeCount} פעילות)
                </span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
