'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Eye, Share2, BookOpen, MessageSquare } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import type { Article } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ReferrerEntry {
  referrer: string;
  count: number;
}

type EventType = 'view' | 'share' | 'read_complete' | 'comment';

const CHART_COLORS = ['#0099DB', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const statCards: { key: EventType; label: string; icon: typeof Eye }[] = [
  { key: 'view', label: 'צפיות', icon: Eye },
  { key: 'share', label: 'שיתופים', icon: Share2 },
  { key: 'read_complete', label: 'קריאה מלאה', icon: BookOpen },
  { key: 'comment', label: 'תגובות', icon: MessageSquare },
];

export default function ArticleAnalyticsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.get<Article>(`/articles/${id}/by-id`),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['article-analytics', id],
    queryFn: () => api.get<Record<string, number>>(`/article-analytics/article/${id}`),
  });

  const { data: trendData } = useQuery({
    queryKey: ['article-trend', id],
    queryFn: () =>
      api.get<{ date: string; count: number }[]>(
        `/article-analytics/article/${id}/trend?eventType=view&days=30`
      ),
  });

  const { data: referrerData } = useQuery({
    queryKey: ['article-referrers', id],
    queryFn: () =>
      api.get<ReferrerEntry[]>(`/article-analytics/referrers?articleId=${id}`),
  });

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/articles">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {articleLoading ? (
              <span className="inline-block h-7 w-64 bg-gray-200 rounded animate-pulse" />
            ) : (
              article?.title ?? 'אנליטיקס כתבה'
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">אנליטיקס כתבה</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <div className="text-3xl font-bold mt-1">
                {statsLoading ? (
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  (stats?.[key] ?? 0).toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מגמת צפיות (30 ימים)</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: string) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(val: string) => {
                      const d = new Date(val);
                      return d.toLocaleDateString('he-IL');
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'צפיות']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0099DB"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrer pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מקורות הפניה</CardTitle>
          </CardHeader>
          <CardContent>
            {referrerData && referrerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={referrerData}
                    dataKey="count"
                    nameKey="referrer"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ referrer, percent }: { referrer: string; percent: number }) =>
                      `${referrer} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {referrerData.map((_entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'כניסות']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
