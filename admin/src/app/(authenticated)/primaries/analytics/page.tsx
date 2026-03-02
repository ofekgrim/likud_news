'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

// ── Chart color palette ──────────────────────────────────────────────────

const COLORS = ['#0099DB', '#1E3A8A', '#DC2626', '#059669', '#D97706', '#7C3AED', '#EC4899', '#06B6D4'];

// ── Types for analytics responses ────────────────────────────────────────

interface QuizAnalytics {
  total: number;
  completed: number;
  avgScore: number;
}

interface EndorsementAnalytics {
  candidates: { name: string; count: number }[];
}

interface PollAnalytics {
  polls: { question: string; votes: number }[];
}

interface EventAnalytics {
  events: { title: string; going: number; interested: number }[];
}

// ── Loading skeleton for chart cards ─────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-64 flex flex-col items-center justify-center space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
      {message}
    </div>
  );
}

export default function AnalyticsPage() {
  const [electionId, setElectionId] = useState<string | undefined>(undefined);

  // ── Quiz Analytics ─────────────────────────────────────────────────────

  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['analytics-quiz', electionId],
    queryFn: () => api.get<QuizAnalytics>(`/elections/${electionId}/analytics/quiz`),
    enabled: !!electionId,
  });

  // ── Endorsement Analytics ──────────────────────────────────────────────

  const { data: endorsementData, isLoading: endorsementLoading } = useQuery({
    queryKey: ['analytics-endorsements', electionId],
    queryFn: () =>
      api.get<EndorsementAnalytics>(`/elections/${electionId}/analytics/endorsements`),
    enabled: !!electionId,
  });

  // ── Poll Analytics ─────────────────────────────────────────────────────

  const { data: pollData, isLoading: pollLoading } = useQuery({
    queryKey: ['analytics-polls', electionId],
    queryFn: () => api.get<PollAnalytics>(`/elections/${electionId}/analytics/polls`),
    enabled: !!electionId,
  });

  // ── Event Analytics ────────────────────────────────────────────────────

  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['analytics-events', electionId],
    queryFn: () => api.get<EventAnalytics>(`/elections/${electionId}/analytics/events`),
    enabled: !!electionId,
  });

  // ── Derived data ──────────────────────────────────────────────────────

  const completionRate =
    quizData && quizData.total > 0
      ? Math.round((quizData.completed / quizData.total) * 100)
      : 0;

  const quizChartData = quizData
    ? [
        { name: 'השלימו', value: quizData.completed },
        { name: 'לא השלימו', value: quizData.total - quizData.completed },
      ]
    : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">אנליטיקס בחירות</h1>
        <p className="text-sm text-gray-500 mt-1">
          סטטיסטיקות ונתונים מפורטים לפי בחירות
        </p>
      </div>

      {/* Election Selector */}
      <div className="mb-6 w-full sm:w-64">
        <ElectionSelector
          value={electionId}
          onChange={setElectionId}
          label="בחר בחירות"
        />
      </div>

      {!electionId ? (
        <div className="text-center py-16 text-gray-400">
          בחר בחירות כדי לצפות בנתונים
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Card 1: Quiz Completion ──────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">השלמת שאלון</CardTitle>
            </CardHeader>
            <CardContent>
              {quizLoading ? (
                <ChartSkeleton />
              ) : !quizData || quizData.total === 0 ? (
                <EmptyState message="אין נתונים" />
              ) : (
                <div>
                  {/* Big numbers */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0099DB]">
                        {completionRate}%
                      </div>
                      <div className="text-xs text-gray-500">אחוז השלמה</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-gray-700">
                        {quizData.completed}/{quizData.total}
                      </div>
                      <div className="text-xs text-gray-500">השלימו</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-gray-700">
                        {quizData.avgScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">ציון ממוצע</div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quizChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0099DB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card 2: Endorsement Distribution ────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">התפלגות תמיכות</CardTitle>
            </CardHeader>
            <CardContent>
              {endorsementLoading ? (
                <ChartSkeleton />
              ) : !endorsementData || endorsementData.candidates.length === 0 ? (
                <EmptyState message="אין נתונים" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={endorsementData.candidates}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {endorsementData.candidates.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card 3: Poll Participation ──────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">השתתפות בסקרים</CardTitle>
            </CardHeader>
            <CardContent>
              {pollLoading ? (
                <ChartSkeleton />
              ) : !pollData || pollData.polls.length === 0 ? (
                <EmptyState message="אין נתונים" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pollData.polls}
                      layout="vertical"
                      margin={{ right: 20, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="question"
                        type="category"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#1E3A8A" radius={[0, 4, 4, 0]} name="הצבעות" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card 4: Event RSVPs ────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">אישורי הגעה לאירועים</CardTitle>
            </CardHeader>
            <CardContent>
              {eventLoading ? (
                <ChartSkeleton />
              ) : !eventData || eventData.events.length === 0 ? (
                <EmptyState message="אין נתונים" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventData.events}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="title"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="going"
                        stackId="rsvp"
                        fill="#059669"
                        name="מגיעים"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="interested"
                        stackId="rsvp"
                        fill="#D97706"
                        name="מתעניינים"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
