'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Period = 'daily' | 'weekly' | 'monthly';
type EventType = 'view' | 'share' | 'read_complete' | 'comment';

interface TopArticle {
  articleId: string;
  title: string;
  heroImageUrl?: string;
  count: number;
}

interface ReferrerEntry {
  referrer: string;
  count: number;
}

const periodLabels: Record<Period, string> = {
  daily: 'היום',
  weekly: 'השבוע',
  monthly: 'החודש',
};

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const from = new Date(now);
  if (period === 'daily') {
    from.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    from.setDate(from.getDate() - 7);
  } else {
    from.setMonth(from.getMonth() - 1);
  }
  return { from: from.toISOString().split('T')[0], to };
}

const CHART_COLORS = ['#0099DB', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const statCards: { key: EventType; label: string; icon: typeof Eye }[] = [
  { key: 'view', label: 'צפיות', icon: Eye },
  { key: 'share', label: 'שיתופים', icon: Share2 },
  { key: 'read_complete', label: 'קריאה מלאה', icon: BookOpen },
  { key: 'comment', label: 'תגובות', icon: MessageSquare },
];

export default function ArticleAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [topEventType, setTopEventType] = useState<EventType>('view');

  const dateRange = getDateRange(period);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: () =>
      api.get<Record<string, number>>(
        `/article-analytics/overview?from=${dateRange.from}&to=${dateRange.to}`
      ),
  });

  const { data: topArticles, isLoading: topLoading } = useQuery({
    queryKey: ['analytics-top', topEventType, period],
    queryFn: () =>
      api.get<TopArticle[]>(
        `/article-analytics/top?eventType=${topEventType}&period=${period}&limit=10`
      ),
  });

  // Use first top article for trend + referrers if available
  const firstArticleId = topArticles?.[0]?.articleId;

  const { data: trendData } = useQuery({
    queryKey: ['analytics-trend', firstArticleId],
    queryFn: () =>
      api.get<{ date: string; count: number }[]>(
        `/article-analytics/article/${firstArticleId}/trend?eventType=view&days=30`
      ),
    enabled: !!firstArticleId,
  });

  const { data: referrerData } = useQuery({
    queryKey: ['analytics-referrers', firstArticleId],
    queryFn: () =>
      api.get<ReferrerEntry[]>(
        `/article-analytics/referrers?articleId=${firstArticleId}`
      ),
    enabled: !!firstArticleId,
  });

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/articles">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">אנליטיקס כתבות</h1>
        </div>
      </div>

      {/* Period toggle */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <div className="text-3xl font-bold mt-1">
                {overviewLoading ? (
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  (overview?.[key] ?? 0).toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              מגמת צפיות (30 ימים)
              {firstArticleId && topArticles?.[0] && (
                <span className="text-sm font-normal text-gray-500 mr-2">
                  — {topArticles[0].title}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
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
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                {firstArticleId ? 'טוען נתונים...' : 'אין נתונים להצגה'}
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
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={referrerData}
                    dataKey="count"
                    nameKey="referrer"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                {firstArticleId ? 'טוען נתונים...' : 'אין נתונים להצגה'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Articles table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">כתבות מובילות</CardTitle>
            <div className="flex gap-2">
              {(
                [
                  { key: 'view' as EventType, label: 'צפיות' },
                  { key: 'share' as EventType, label: 'שיתופים' },
                  { key: 'read_complete' as EventType, label: 'קריאה מלאה' },
                ] as const
              ).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={topEventType === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTopEventType(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-12">#</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">כתבה</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-32">
                    {topEventType === 'view' ? 'צפיות' : topEventType === 'share' ? 'שיתופים' : 'קריאה מלאה'}
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-4 py-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !topArticles || topArticles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">
                      אין נתונים לתקופה זו
                    </td>
                  </tr>
                ) : (
                  topArticles.map((article, i) => (
                    <tr key={article.articleId} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {article.heroImageUrl && (
                            <Image
                              src={article.heroImageUrl}
                              alt=""
                              width={48}
                              height={32}
                              className="rounded object-cover flex-shrink-0"
                              style={{ width: 48, height: 32 }}
                            />
                          )}
                          <span className="font-medium text-gray-900 line-clamp-1">
                            {article.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        {article.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/articles/${article.articleId}/analytics`}>
                          <Button variant="ghost" size="sm">
                            פרטים
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
