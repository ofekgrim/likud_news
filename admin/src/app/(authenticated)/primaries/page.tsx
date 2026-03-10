'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Vote,
  Users,
  Target,
  HelpCircle,
  Calendar,
  MapPin,
  BarChart3,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { PrimaryElection, PrimaryCandidate, CandidateEndorsement } from '@/lib/types';

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

export default function PrimariesDashboardPage() {
  // Fetch elections
  const { data: electionsRes } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<{ data: PrimaryElection[] }>('/elections'),
  });
  const elections = electionsRes?.data ?? [];

  // Find active election
  const activeElection = elections.find(
    (e) => e.status === 'active' || e.status === 'voting',
  ) ?? elections[0];

  // Fetch candidates for active election
  const { data: candidatesRes } = useQuery({
    queryKey: ['candidates', activeElection?.id],
    queryFn: () =>
      api.get<{ data: PrimaryCandidate[] }>(
        `/candidates?electionId=${activeElection!.id}`,
      ),
    enabled: !!activeElection?.id,
  });
  const candidates = candidatesRes?.data ?? [];

  // Fetch endorsements count
  const { data: endorsementsRes } = useQuery({
    queryKey: ['endorsements', activeElection?.id],
    queryFn: () =>
      api.get<{ data: CandidateEndorsement[] }>(
        `/endorsements?electionId=${activeElection!.id}`,
      ),
    enabled: !!activeElection?.id,
  });
  const totalEndorsements = endorsementsRes?.data?.length ?? 0;

  // Fetch quiz responses count
  const { data: quizResponsesRes } = useQuery({
    queryKey: ['quiz-responses', activeElection?.id],
    queryFn: () =>
      api.get<{ data: unknown[]; total: number }>(
        `/elections/${activeElection!.id}/quiz/responses`,
      ),
    enabled: !!activeElection?.id,
  });
  const quizCompletions = quizResponsesRes?.total ?? 0;

  // Fetch campaign events count
  const { data: eventsRes } = useQuery({
    queryKey: ['campaign-events-count'],
    queryFn: () =>
      api.get<{ data: unknown[]; total: number }>('/campaign-events?limit=1'),
  });
  const campaignEventsCount = eventsRes?.total ?? 0;

  // Compute total endorsements from candidates
  const totalEndorsementsFromCandidates = candidates.reduce(
    (sum, c) => sum + (c.endorsementCount ?? 0),
    0,
  );
  const endorsementDisplay =
    totalEndorsementsFromCandidates > 0
      ? totalEndorsementsFromCandidates
      : totalEndorsements;

  const stats = [
    {
      label: 'בחירות פעילות',
      value: activeElection?.title ?? 'אין',
      icon: Vote,
      borderColor: 'border-l-blue-500',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      isText: true,
    },
    {
      label: 'מועמדים',
      value: candidates.length,
      icon: Users,
      borderColor: 'border-l-emerald-500',
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'תמיכות',
      value: endorsementDisplay,
      icon: Target,
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'שאלונים שהושלמו',
      value: quizCompletions,
      icon: HelpCircle,
      borderColor: 'border-l-violet-500',
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'אירועי קמפיין',
      value: campaignEventsCount,
      icon: Calendar,
      borderColor: 'border-l-rose-500',
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  const quickLinks = [
    { href: '/primaries/elections', label: 'בחירות', icon: Vote },
    { href: '/primaries/candidates', label: 'מועמדים', icon: Users },
    { href: '/primaries/endorsements', label: 'תמיכות', icon: Target },
    { href: '/primaries/quiz', label: 'שאלון התאמה', icon: HelpCircle },
    { href: '/primaries/stations', label: 'קלפיות', icon: MapPin },
    { href: '/primaries/results', label: 'תוצאות', icon: BarChart3 },
    { href: '/primaries/events', label: 'אירועים', icon: Calendar },
    { href: '/primaries/gamification', label: 'גיימיפיקציה', icon: Trophy },
    { href: '/primaries/turnout', label: 'אחוזי הצבעה', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">לוח בקרה - פריימריז</h1>
        <p className="text-sm text-gray-500 mt-1">
          סקירה כללית של מערכת הפריימריז
        </p>
      </div>

      {/* Active Election Banner */}
      {activeElection && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Vote className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeElection.title}
                  </h2>
                  <p className="text-xs text-gray-500">
                    תאריך:{' '}
                    {new Date(activeElection.electionDate).toLocaleDateString(
                      'he-IL',
                    )}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadge(activeElection.status).variant}>
                {getStatusBadge(activeElection.status).label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
              <p
                className={`font-bold text-gray-900 ${
                  stat.isText ? 'text-base truncate' : 'text-2xl'
                }`}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ניווט מהיר</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <link.icon className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium">{link.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Candidates by Endorsements */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                מועמדים מובילים לפי תמיכות
              </CardTitle>
              <Link href="/primaries/candidates">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  הצג הכל
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {[...candidates]
                .sort((a, b) => b.endorsementCount - a.endorsementCount)
                .slice(0, 5)
                .map((candidate, idx) => (
                  <Link
                    key={candidate.id}
                    href={`/primaries/candidates/${candidate.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50/80 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      {candidate.photoUrl ? (
                        <img
                          src={candidate.photoUrl}
                          alt={candidate.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {candidate.fullName}
                        </p>
                        {candidate.district && (
                          <p className="text-xs text-gray-400">
                            {candidate.district}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        {candidate.endorsementCount}
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
