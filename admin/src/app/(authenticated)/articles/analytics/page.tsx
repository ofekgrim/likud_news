'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Eye, Share2, BookOpen, MessageSquare } from 'lucide-react';
import {
  AreaChart,
  Area,
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

// Hebrew labels for referrer sources
const REFERRER_LABELS: Record<string, string> = {
  home_feed: 'פיד ראשי',
  category: 'קטגוריה',
  search: 'חיפוש',
  push: 'התראה',
  deeplink: 'קישור ישיר',
  external: 'חיצוני',
  direct: 'ישיר',
  social: 'רשתות חברתיות',
  unknown: 'אחר',
};

function getHebrewReferrer(key: string): string {
  return REFERRER_LABELS[key] || key;
}

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

const RADIAN = Math.PI / 180;
function renderOuterLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  referrer,
  percent,
  fill,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  referrer: string;
  percent: number;
  fill: string;
}) {
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const mx = cx + (outerRadius + 14) * cos;
  const my = cy + (outerRadius + 14) * sin;
  const ex = cx + (outerRadius + 40) * cos;
  const ey = cy + (outerRadius + 40) * sin;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${cx + outerRadius * cos},${cy + outerRadius * sin}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2} fill={fill} />
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey} textAnchor={textAnchor} fill="#374151" fontSize={12} dominantBaseline="central">
        {`${getHebrewReferrer(referrer)} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}

const statCards: { key: EventType; label: string; icon: typeof Eye; color: string; bg: string }[] = [
  { key: 'view', label: 'צפיות', icon: Eye, color: 'text-[#0099DB]', bg: 'bg-[#0099DB]/10' },
  { key: 'share', label: 'שיתופים', icon: Share2, color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/10' },
  { key: 'read_complete', label: 'קריאה מלאה', icon: BookOpen, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  { key: 'comment', label: 'תגובות', icon: MessageSquare, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
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
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-0.5">
                    {overviewLoading ? (
                      <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      (overview?.[key] ?? 0).toLocaleString()
                    )}
                  </p>
                </div>
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
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099DB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0099DB" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0099DB"
                    strokeWidth={2.5}
                    fill="url(#colorViews)"
                    activeDot={{ r: 5, stroke: '#0099DB', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-400">
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
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={referrerData}
                    dataKey="count"
                    nameKey="referrer"
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    innerRadius={45}
                    paddingAngle={2}
                    label={renderOuterLabel}
                    labelLine={false}
                  >
                    {referrerData.map((_entry, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      getHebrewReferrer(name),
                    ]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend
                    formatter={(value: string) => getHebrewReferrer(value)}
                    wrapperStyle={{ direction: 'rtl', paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[380px] flex items-center justify-center text-gray-400">
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
