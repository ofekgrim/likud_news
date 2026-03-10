'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Send,
  CheckCircle,
  Eye,
  XCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalFailed: number;
  openRate: number;
  deliveryRate: number;
  byContentType: { contentType: string; count: number }[];
  byDay: { date: string; count: number }[];
  recentLogs: {
    id: string;
    title: string;
    contentType: string;
    status: string;
    totalSent: number;
    totalOpened: number;
    sentAt: string;
  }[];
}

const contentTypeLabels: Record<string, string> = {
  article: 'כתבות',
  poll: 'סקרים',
  event: 'אירועים',
  election: 'בחירות',
  quiz: 'שאלונים',
  custom: 'מותאם',
};

const statusLabels: Record<string, { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  pending: { text: 'ממתין', variant: 'warning' },
  sending: { text: 'שולח', variant: 'warning' },
  sent: { text: 'נשלח', variant: 'success' },
  failed: { text: 'נכשל', variant: 'destructive' },
  cancelled: { text: 'בוטל', variant: 'outline' },
};

export default function NotificationsDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['notification-analytics'],
    queryFn: () => api.get<NotificationAnalytics>('/notifications/analytics?days=30'),
  });

  const stats = [
    {
      label: 'נשלחו',
      value: data?.totalSent ?? 0,
      icon: Send,
      color: 'text-[#0099DB]',
      bg: 'bg-[#0099DB]/10',
    },
    {
      label: 'הגיעו',
      value: data?.totalDelivered ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'נפתחו',
      value: data?.totalOpened ?? 0,
      icon: Eye,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'נכשלו',
      value: data?.totalFailed ?? 0,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'אחוז פתיחה',
      value: `${(data?.openRate ?? 0).toFixed(1)}%`,
      icon: Percent,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'אחוז הגעה',
      value: `${(data?.deliveryRate ?? 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-[#1E3A8A]',
      bg: 'bg-[#1E3A8A]/10',
    },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">לוח בקרה — התראות</h1>
        <Link href="/notifications/send">
          <Button>
            <Send className="h-4 w-4 ml-2" />
            שלח התראה
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold">
                {isLoading ? (
                  <span className="inline-block h-6 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  typeof s.value === 'number' ? s.value.toLocaleString() : s.value
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">התראות יומיות (30 ימים)</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byDay && data.byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.byDay}>
                  <defs>
                    <linearGradient id="colorNotif" x1="0" y1="0" x2="0" y2="1">
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
                    labelFormatter={(val: string) => new Date(val).toLocaleDateString('he-IL')}
                    formatter={(value: number) => [value.toLocaleString(), 'התראות']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0099DB"
                    strokeWidth={2}
                    fill="url(#colorNotif)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        {/* By content type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">לפי סוג תוכן</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byContentType && data.byContentType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byContentType.map(c => ({ ...c, name: contentTypeLabels[c.contentType] || c.contentType }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'התראות']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="count" fill="#0099DB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">שליחות אחרונות</CardTitle>
            <Link href="/notifications/history">
              <Button variant="ghost" size="sm">הצג הכל</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">כותרת</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">סוג</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">סטטוס</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">נשלחו</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-20">נפתחו</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 w-32">תאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !data?.recentLogs?.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      אין התראות עדיין
                    </td>
                  </tr>
                ) : (
                  data.recentLogs.map((log) => {
                    const si = statusLabels[log.status] || { text: log.status, variant: 'outline' as const };
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{log.title}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {contentTypeLabels[log.contentType] || log.contentType}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={si.variant}>{si.text}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{log.totalSent}</td>
                        <td className="px-4 py-3 text-gray-600">{log.totalOpened}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {log.sentAt ? new Date(log.sentAt).toLocaleDateString('he-IL') : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
