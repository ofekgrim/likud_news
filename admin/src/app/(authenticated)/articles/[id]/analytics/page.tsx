'use client';

import { use } from 'react';
import Link from 'next/link';
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
import type { Article } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ReferrerEntry {
  referrer: string;
  count: number;
}

type EventType = 'view' | 'share' | 'read_complete' | 'comment';

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

const statCards: { key: EventType; label: string; icon: typeof Eye; color: string; bg: string }[] = [
  { key: 'view', label: 'צפיות', icon: Eye, color: 'text-[#0099DB]', bg: 'bg-[#0099DB]/10' },
  { key: 'share', label: 'שיתופים', icon: Share2, color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/10' },
  { key: 'read_complete', label: 'קריאה מלאה', icon: BookOpen, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  { key: 'comment', label: 'תגובות', icon: MessageSquare, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
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
                    {statsLoading ? (
                      <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      (stats?.[key] ?? 0).toLocaleString()
                    )}
                  </p>
                </div>
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
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorViewsDetail" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorViewsDetail)"
                    activeDot={{ r: 5, stroke: '#0099DB', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-gray-400">
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
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
