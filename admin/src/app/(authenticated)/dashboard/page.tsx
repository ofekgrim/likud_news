'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Newspaper,
  FolderOpen,
  Radio,
  Users,
  Mail,
  Plus,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type {
  PaginatedResponse,
  Article,
  Category,
  TickerItem,
  Member,
  ContactMessage,
} from '@/lib/types';

const statusLabels: Record<
  string,
  { text: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  published: { text: 'פורסם', variant: 'success' },
  draft: { text: 'טיוטה', variant: 'warning' },
  archived: { text: 'בארכיון', variant: 'destructive' },
};

export default function DashboardPage() {
  const { data: articles } = useQuery({
    queryKey: ['articles-count'],
    queryFn: () => api.get<PaginatedResponse<Article>>('/articles?limit=1'),
  });

  const { data: recentArticles } = useQuery({
    queryKey: ['recent-articles'],
    queryFn: () => api.get<PaginatedResponse<Article>>('/articles?limit=5'),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

  const { data: ticker } = useQuery({
    queryKey: ['ticker'],
    queryFn: () => api.get<TickerItem[]>('/ticker'),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const { data: contactResult } = useQuery({
    queryKey: ['contact-unread'],
    queryFn: () =>
      api.get<{ data: ContactMessage[]; total: number }>(
        '/contact?isRead=false'
      ),
  });

  const unreadCount = contactResult?.total ?? 0;

  const stats = [
    {
      label: 'כתבות',
      value: articles?.total ?? '-',
      icon: Newspaper,
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'קטגוריות',
      value: categories?.length ?? '-',
      icon: FolderOpen,
      borderColor: 'border-l-emerald-500',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'פריטי טיקר',
      value: ticker?.length ?? '-',
      icon: Radio,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'חברי כנסת',
      value: members?.length ?? '-',
      icon: Users,
      borderColor: 'border-l-violet-500',
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'הודעות שלא נקראו',
      value: unreadCount,
      icon: Mail,
      borderColor: 'border-l-rose-500',
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`border-l-4 ${stat.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">פעולות מהירות</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/articles/new">
              <Button size="sm">
                <Plus className="h-4 w-4 ml-1" />
                כתבה חדשה
              </Button>
            </Link>
            <Link href="/ticker">
              <Button variant="outline" size="sm">
                <Radio className="h-4 w-4 ml-1" />
                פריט טיקר
              </Button>
            </Link>
            <Link href="/push">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 ml-1" />
                שליחת התראה
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Articles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">כתבות אחרונות</CardTitle>
            <Link href="/articles">
              <Button variant="ghost" size="sm" className="text-gray-500">
                הצג הכל
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentArticles?.data && recentArticles.data.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentArticles.data.map((article) => {
                const statusInfo = statusLabels[article.status] ?? {
                  text: article.status,
                  variant: 'outline' as const,
                };
                return (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}/edit`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50/80 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {article.publishedAt
                          ? formatDate(article.publishedAt)
                          : formatDate(article.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant} className="mr-3 shrink-0">
                      {statusInfo.text}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">
              אין כתבות עדיין
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
