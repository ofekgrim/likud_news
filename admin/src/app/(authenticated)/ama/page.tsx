'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import {
  MessageSquare,
  Plus,
  Play,
  StopCircle,
  Pencil,
  Pin,
  CheckCircle,
  XCircle,
  Radio,
  Users,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAmaSessions,
  getAmaSessionDetail,
  createAmaSession,
  updateAmaSession,
  startAmaSession,
  endAmaSession,
  moderateAmaQuestion,
  answerAmaQuestion,
  pinAmaQuestion,
} from '@/lib/api';
import type { AmaSession, AmaSessionStatus, AmaQuestion, AmaQuestionStatus } from '@/lib/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TABS: { key: AmaSessionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'live', label: 'שידור חי' },
  { key: 'upcoming', label: 'קרובים' },
  { key: 'ended', label: 'הסתיימו' },
  { key: 'draft', label: 'טיוטות' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

const STAT_COLOR_MAP: Record<string, string> = {
  green: 'bg-green-50 border-green-100',
  orange: 'bg-orange-50 border-orange-100',
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
};

function StatCard({
  label,
  value,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`rounded-lg border shadow-sm p-4 ${STAT_COLOR_MAP[color] ?? 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SessionStatusBadge({ status }: { status: AmaSessionStatus }) {
  const map: Record<AmaSessionStatus, { label: string; className: string }> = {
    live: { label: 'שידור חי', className: 'bg-green-100 text-green-800 border-green-200' },
    upcoming: { label: 'קרוב', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    ended: { label: 'הסתיים', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    draft: { label: 'טיוטה', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  };
  const { label, className } = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {label}
    </span>
  );
}

function QuestionStatusBadge({ status }: { status: AmaQuestionStatus }) {
  const map: Record<AmaQuestionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'ממתין', variant: 'secondary' },
    approved: { label: 'אושר', variant: 'default' },
    rejected: { label: 'נדחה', variant: 'destructive' },
  };
  const { label, variant } = map[status] ?? map.pending;
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Questions Modal ───────────────────────────────────────────────────────────

function QuestionsModal({
  session,
  onClose,
}: {
  session: AmaSession;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<AmaQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [questionFilter, setQuestionFilter] = useState<AmaQuestionStatus | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['ama-session-detail', session.id],
    queryFn: () => getAmaSessionDetail(session.id),
  });

  const questions: AmaQuestion[] = (data as { questions?: AmaQuestion[] })?.questions ?? [];

  const filtered = useMemo(() => {
    if (questionFilter === 'all') return questions;
    return questions.filter((q) => q.status === questionFilter);
  }, [questions, questionFilter]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['ama-session-detail', session.id] });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      moderateAmaQuestion(id, action),
    onSuccess: (_, vars) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['ama-sessions'] });
      toast.success(vars.action === 'approve' ? 'השאלה אושרה' : 'השאלה נדחתה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במודרציה'),
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => answerAmaQuestion(id, text),
    onSuccess: () => {
      invalidate();
      setAnswerDialogOpen(false);
      setAnsweringQuestion(null);
      setAnswerText('');
      toast.success('התשובה נשמרה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירת תשובה'),
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => pinAmaQuestion(id),
    onSuccess: () => {
      invalidate();
      toast.success('השאלה הוצמדה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בהצמדה'),
  });

  const pendingCount = questions.filter((q) => q.status === 'pending').length;

  return (
    <Dialog open onClose={onClose} className="max-w-3xl">
      <div dir="rtl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <DialogTitle className="text-lg font-bold">{session.title}</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {questions.length} שאלות
              {pendingCount > 0 && (
                <span className="mr-2 bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5 text-xs">
                  {pendingCount} ממתינות
                </span>
              )}
            </p>
          </div>
          <SessionStatusBadge status={session.status} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b mb-4">
          {([
            { key: 'all' as const, label: 'הכל' },
            { key: 'pending' as const, label: 'ממתינות' },
            { key: 'approved' as const, label: 'אושרו' },
            { key: 'rejected' as const, label: 'נדחו' },
          ] as { key: AmaQuestionStatus | 'all'; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setQuestionFilter(tab.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                questionFilter === tab.key
                  ? 'bg-white border border-b-white text-[#0099DB] border-gray-200 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">אין שאלות בקטגוריה זו.</p>
          ) : (
            filtered.map((question) => (
              <div
                key={question.id}
                className={`rounded-lg border p-4 ${question.isPinned ? 'border-blue-200 bg-blue-50/30' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {question.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                      <span className="text-xs text-gray-500">{question.authorName}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{question.upvoteCount} הצבעות</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-400">{formatDate(question.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{question.questionText}</p>
                    {question.answerText && (
                      <div className="mt-2 bg-green-50 border border-green-100 rounded p-2.5">
                        <p className="text-xs text-green-700 font-medium mb-1">תשובה:</p>
                        <p className="text-sm text-green-800">{question.answerText}</p>
                        {question.answeredAt && (
                          <p className="text-xs text-green-600 mt-1">{formatDate(question.answeredAt)}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <QuestionStatusBadge status={question.status} />
                    {question.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moderateMutation.mutate({ id: question.id, action: 'approve' })}
                          disabled={moderateMutation.isPending}
                          title="אשר שאלה"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moderateMutation.mutate({ id: question.id, action: 'reject' })}
                          disabled={moderateMutation.isPending}
                          title="דחה שאלה"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    {question.status === 'approved' && !question.answerText && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setAnsweringQuestion(question);
                          setAnswerText('');
                          setAnswerDialogOpen(true);
                        }}
                        title="הוסף תשובה"
                      >
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {question.status === 'approved' && !question.isPinned && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pinMutation.mutate(question.id)}
                        disabled={pinMutation.isPending}
                        title="הצמד שאלה"
                      >
                        <Pin className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>סגור</Button>
        </div>
      </div>

      {/* Answer dialog */}
      {answerDialogOpen && answeringQuestion && (
        <Dialog open onClose={() => setAnswerDialogOpen(false)} className="max-w-lg">
          <div dir="rtl">
            <DialogTitle>תשובה לשאלה</DialogTitle>
            <div className="py-3">
              <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded p-2.5">
                {answeringQuestion.questionText}
              </p>
              <div className="space-y-1.5">
                <Label>תשובה *</Label>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="כתוב תשובה..."
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>ביטול</Button>
              <Button
                onClick={() => answeringQuestion && answerMutation.mutate({ id: answeringQuestion.id, text: answerText })}
                disabled={!answerText.trim() || answerMutation.isPending}
              >
                {answerMutation.isPending ? 'שומר...' : 'שמור תשובה'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  );
}

// ── Session Form Dialog ───────────────────────────────────────────────────────

const EMPTY_SESSION_FORM = {
  candidateId: '',
  title: '',
  description: '',
  scheduledAt: '',
};

function SessionFormDialog({
  open,
  onClose,
  editingSession,
  form,
  setForm,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  editingSession: AmaSession | null;
  form: typeof EMPTY_SESSION_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_SESSION_FORM>>;
  onSave: () => void;
  isSaving: boolean;
}) {
  const isEdit = !!editingSession;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg">
      <div dir="rtl">
        <DialogTitle>{isEdit ? 'עריכת מפגש AMA' : 'מפגש AMA חדש'}</DialogTitle>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>מזהה מועמד *</Label>
              <Input
                value={form.candidateId}
                onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
                placeholder="UUID של המועמד"
                dir="ltr"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="כותרת המפגש"
            />
          </div>
          <div className="space-y-1.5">
            <Label>תיאור</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="תיאור המפגש..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>תאריך ושעה מתוכננים *</Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            onClick={onSave}
            disabled={!form.title || (!isEdit && !form.candidateId) || !form.scheduledAt || isSaving}
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AmaSessionsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AmaSessionStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AmaSession | null>(null);
  const [viewingSession, setViewingSession] = useState<AmaSession | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SESSION_FORM });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['ama-sessions'],
    queryFn: () => getAmaSessions(),
  });

  // ── Derived stats ──
  const stats = useMemo(() => {
    const total = sessions.length;
    const liveNow = sessions.filter((s) => s.status === 'live').length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionCount, 0);
    return { total, liveNow, totalQuestions };
  }, [sessions]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    if (activeTab === 'all') return sessions;
    return sessions.filter((s) => s.status === activeTab);
  }, [sessions, activeTab]);

  const liveCount = stats.liveNow;

  const invalidateAll = () => qc.invalidateQueries({ queryKey: ['ama-sessions'] });

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async (f: typeof EMPTY_SESSION_FORM) => {
      if (editingSession) {
        return updateAmaSession(editingSession.id, {
          title: f.title,
          description: f.description,
          scheduledAt: f.scheduledAt ? new Date(f.scheduledAt).toISOString() : undefined,
        });
      }
      return createAmaSession({
        candidateId: f.candidateId,
        title: f.title,
        description: f.description,
        scheduledAt: new Date(f.scheduledAt).toISOString(),
      });
    },
    onSuccess: () => {
      invalidateAll();
      setDialogOpen(false);
      setEditingSession(null);
      toast.success(editingSession ? 'המפגש עודכן' : 'המפגש נוצר');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשמירה'),
  });

  const startMutation = useMutation({
    mutationFn: startAmaSession,
    onSuccess: () => {
      invalidateAll();
      toast.success('המפגש התחיל — שידור חי');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בהתחלת מפגש'),
  });

  const endMutation = useMutation({
    mutationFn: endAmaSession,
    onSuccess: () => {
      invalidateAll();
      toast.success('המפגש הסתיים');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בסיום מפגש'),
  });

  const openCreate = () => {
    setEditingSession(null);
    setForm({ ...EMPTY_SESSION_FORM });
    setDialogOpen(true);
  };

  const openEdit = (session: AmaSession) => {
    setEditingSession(session);
    const localDt = session.scheduledAt
      ? new Date(session.scheduledAt).toISOString().slice(0, 16)
      : '';
    setForm({
      candidateId: session.candidateId,
      title: session.title,
      description: session.description,
      scheduledAt: localDt,
    });
    setDialogOpen(true);
  };

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">מפגשי AMA</h1>
            <p className="text-sm text-gray-500 mt-1">שאל אותי כל דבר — ניהול מפגשים ומודרציה</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />
          מפגש חדש
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="סה״כ מפגשים"
          value={stats.total}
          icon={<HelpCircle className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatCard
          label="שידור חי עכשיו"
          value={liveCount}
          icon={<Radio className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatCard
          label="קרובים"
          value={sessions.filter((s) => s.status === 'upcoming').length}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          color="orange"
        />
        <StatCard
          label="סה״כ שאלות"
          value={stats.totalQuestions.toLocaleString()}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        {SESSION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white border border-b-white text-[#0099DB] border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'live' && liveCount > 0 && (
              <span className="mr-1.5 bg-green-100 text-green-800 rounded-full px-1.5 py-0.5 text-xs">
                {liveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium">מועמד</th>
              <th className="text-center px-4 py-3 font-medium">סטטוס</th>
              <th className="text-center px-4 py-3 font-medium">תאריך מתוכנן</th>
              <th className="text-center px-4 py-3 font-medium">התחלה</th>
              <th className="text-center px-4 py-3 font-medium">סיום</th>
              <th className="text-center px-4 py-3 font-medium">שאלות</th>
              <th className="text-center px-4 py-3 font-medium w-36">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  אין מפגשים בקטגוריה זו.
                </td>
              </tr>
            ) : (
              filtered.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium max-w-[220px]">
                    <span className="truncate block">{session.title}</span>
                    {session.description && (
                      <span className="text-xs text-gray-400 truncate block mt-0.5">
                        {session.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">
                    {session.candidateName || session.candidateId.slice(0, 8) + '…'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <SessionStatusBadge status={session.status} />
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-600">
                    {formatDate(session.scheduledAt)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                    {formatDate(session.startedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                    {formatDate(session.endedAt)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono text-xs">
                    {session.questionCount}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {/* View questions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingSession(session)}
                        title="צפה בשאלות"
                      >
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </Button>

                      {/* Start — only for upcoming */}
                      {session.status === 'upcoming' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startMutation.mutate(session.id)}
                          disabled={startMutation.isPending}
                          title="התחל מפגש"
                        >
                          <Play className="h-4 w-4 text-green-600" />
                        </Button>
                      )}

                      {/* End — only for live */}
                      {session.status === 'live' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => endMutation.mutate(session.id)}
                          disabled={endMutation.isPending}
                          title="סיים מפגש"
                        >
                          <StopCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      )}

                      {/* Edit — not for ended */}
                      {session.status !== 'ended' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(session)}
                          title="ערוך מפגש"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      {sessions.length > 0 && (
        <div className="mb-6 flex items-center gap-4 text-xs text-gray-500">
          <span>סה״כ: {sessions.length} מפגשים</span>
          <span>שידור חי: {liveCount}</span>
          <span>קרובים: {sessions.filter((s) => s.status === 'upcoming').length}</span>
          <span>הסתיימו: {sessions.filter((s) => s.status === 'ended').length}</span>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <SessionFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingSession(null); }}
        editingSession={editingSession}
        form={form}
        setForm={setForm}
        onSave={() => saveMutation.mutate(form)}
        isSaving={saveMutation.isPending}
      />

      {/* Questions Modal */}
      {viewingSession && (
        <QuestionsModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
        />
      )}
    </div>
  );
}
