'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  TrendingUp,
  Activity,
  Eye,
  BookOpen,
  Share2,
  MessageSquare,
  RefreshCcw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const CHART_COLORS = ['#0099DB', '#1E3A8A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const ROLE_LABELS: Record<string, string> = {
  guest: 'אורח',
  member: 'חבר',
  verified_member: 'חבר מאומת',
};

const MEMBERSHIP_LABELS: Record<string, string> = {
  unverified: 'לא מאומת',
  pending: 'ממתין',
  verified: 'מאומת',
  expired: 'פג תוקף',
};

const FUNNEL_LABELS: Record<string, string> = {
  view: 'צפיות',
  read_complete: 'קריאה מלאה',
  share: 'שיתוף',
  comment: 'תגובה',
};

const FUNNEL_ICONS: Record<string, typeof Eye> = {
  view: Eye,
  read_complete: BookOpen,
  share: Share2,
  comment: MessageSquare,
};

const FUNNEL_COLORS: Record<string, string> = {
  view: '#0099DB',
  read_complete: '#10B981',
  share: '#1E3A8A',
  comment: '#F59E0B',
};

export default function GrowthAnalyticsPage() {
  const [growthDays, setGrowthDays] = useState(30);

  // DAU / WAU / MAU
  const { data: activeUsers, isLoading: activeLoading } = useQuery({
    queryKey: ['analytics-active-users'],
    queryFn: () => api.get<{ dau: number; wau: number; mau: number }>('/app-users/analytics/active-users'),
  });

  // User growth trend
  const { data: growthTrend, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics-growth', growthDays],
    queryFn: () => api.get<Array<{ date: string; count: number }>>(`/app-users/analytics/growth?days=${growthDays}`),
  });

  // User segments
  const { data: segments } = useQuery({
    queryKey: ['analytics-segments'],
    queryFn: () =>
      api.get<{
        byRole: Array<{ role: string; count: number }>;
        byMembership: Array<{ status: string; count: number }>;
      }>('/app-users/analytics/segments'),
  });

  // Engagement funnel
  const { data: funnel } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => api.get<Array<{ stage: string; count: number }>>('/article-analytics/funnel'),
  });

  // Retention cohorts
  const { data: retention } = useQuery({
    queryKey: ['analytics-retention'],
    queryFn: () =>
      api.get<Array<{ cohort: string; registered: number; retained: number[] }>>('/app-users/analytics/retention?weeks=8'),
  });

  // Live readers
  const { data: liveReaders } = useQuery({
    queryKey: ['analytics-live-readers'],
    queryFn: () => api.get<{ count: number }>('/article-analytics/live-readers'),
    refetchInterval: 60000,
  });

  const totalUsers = segments
    ? segments.byRole.reduce((sum, r) => sum + r.count, 0)
    : 0;

  const funnelMax = funnel?.[0]?.count || 1;

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אנליטיקס צמיחה</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {liveReaders && liveReaders.count > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {liveReaders.count} קוראים עכשיו
            </span>
          )}
        </div>
      </div>

      {/* DAU / WAU / MAU cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סה"כ משתמשים', value: totalUsers, icon: Users, color: '#8B5CF6', bg: 'bg-purple-50' },
          { label: 'יומי (DAU)', value: activeUsers?.dau, icon: Activity, color: '#0099DB', bg: 'bg-[#0099DB]/10' },
          { label: 'שבועי (WAU)', value: activeUsers?.wau, icon: TrendingUp, color: '#10B981', bg: 'bg-emerald-50' },
          { label: 'חודשי (MAU)', value: activeUsers?.mau, icon: UserPlus, color: '#1E3A8A', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-0.5">
                    {activeLoading ? (
                      <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      (value ?? 0).toLocaleString()
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth trend + Engagement funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">משתמשים חדשים</CardTitle>
              <div className="flex gap-2">
                {[7, 30, 90].map((d) => (
                  <Button
                    key={d}
                    variant={growthDays === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGrowthDays(d)}
                  >
                    {d} ימים
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400">טוען...</div>
            ) : growthTrend && growthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthTrend}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(val: string) => new Date(val).toLocaleDateString('he-IL')}
                    formatter={(value: number) => [value.toLocaleString(), 'משתמשים חדשים']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0099DB"
                    strokeWidth={2.5}
                    fill="url(#colorGrowth)"
                    activeDot={{ r: 5, stroke: '#0099DB', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">אין נתונים</div>
            )}
          </CardContent>
        </Card>

        {/* Engagement funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">משפך מעורבות</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel && funnel.length > 0 ? (
              <div className="space-y-4 py-4">
                {funnel.map((stage) => {
                  const Icon = FUNNEL_ICONS[stage.stage] || Eye;
                  const color = FUNNEL_COLORS[stage.stage] || '#0099DB';
                  const pct = funnelMax > 0 ? (stage.count / funnelMax) * 100 : 0;
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color }} />
                          <span className="text-sm font-medium">{FUNNEL_LABELS[stage.stage] || stage.stage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{stage.count.toLocaleString()}</span>
                          {stage.stage !== 'view' && (
                            <span className="text-xs text-gray-400">({pct.toFixed(1)}%)</span>
                          )}
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">אין נתונים</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segments + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User segments - pie charts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פילוח משתמשים</CardTitle>
          </CardHeader>
          <CardContent>
            {segments ? (
              <div className="grid grid-cols-2 gap-4">
                {/* By role */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2 text-center">לפי תפקיד</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={segments.byRole}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={2}
                      >
                        {segments.byRole.map((_entry, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          ROLE_LABELS[name] || name,
                        ]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <Legend
                        formatter={(value: string) => ROLE_LABELS[value] || value}
                        wrapperStyle={{ direction: 'rtl', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* By membership */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2 text-center">לפי חברות</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={segments.byMembership}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={2}
                      >
                        {segments.byMembership.map((_entry, i) => (
                          <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value.toLocaleString(),
                          MEMBERSHIP_LABELS[name] || name,
                        ]}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <Legend
                        formatter={(value: string) => MEMBERSHIP_LABELS[value] || value}
                        wrapperStyle={{ direction: 'rtl', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">טוען...</div>
            )}
          </CardContent>
        </Card>

        {/* Retention cohorts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">שימור שבועי (Retention)</CardTitle>
          </CardHeader>
          <CardContent>
            {retention && retention.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right px-2 py-2 font-medium text-gray-500">קוהורט</th>
                      <th className="text-right px-2 py-2 font-medium text-gray-500">נרשמו</th>
                      {Array.from({ length: Math.max(...retention.map(r => r.retained.length), 0) }).map((_, i) => (
                        <th key={i} className="text-center px-2 py-2 font-medium text-gray-500">ש{i + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {retention.map((row) => (
                      <tr key={row.cohort}>
                        <td className="px-2 py-1.5 font-mono text-gray-600">
                          {new Date(row.cohort).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-2 py-1.5 font-semibold">{row.registered}</td>
                        {row.retained.map((count, i) => {
                          const pct = row.registered > 0 ? (count / row.registered) * 100 : 0;
                          const opacity = Math.max(0.1, pct / 100);
                          return (
                            <td
                              key={i}
                              className="text-center px-2 py-1.5"
                              style={{ backgroundColor: `rgba(0, 153, 219, ${opacity})`, color: pct > 50 ? '#fff' : '#374151' }}
                            >
                              {pct.toFixed(0)}%
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400">טוען...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
