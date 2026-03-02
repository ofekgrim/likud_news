'use client';

import { useState, useCallback, useMemo, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import type { QuizQuestion, PrimaryElection, PrimaryCandidate, QuizResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CardSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ArrowRight,
  GripVertical,
  Plus,
  Trash2,
  Pencil,
  X,
  Save,
} from 'lucide-react';

// ── Importance level helpers ──────────────────────────────────────────────

const IMPORTANCE_LABELS: Record<QuizQuestion['importanceLevel'], string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
};

const IMPORTANCE_BADGE_VARIANTS: Record<
  QuizQuestion['importanceLevel'],
  'outline' | 'warning' | 'destructive'
> = {
  low: 'outline',
  medium: 'warning',
  high: 'destructive',
};

// ── Option type ──────────────────────────────────────────────────────────

interface QuestionOption {
  value: number;
  label: string;
  labelEn?: string;
}

// ── Form state ───────────────────────────────────────────────────────────

interface QuestionFormData {
  questionText: string;
  questionTextEn: string;
  importanceLevel: QuizQuestion['importanceLevel'];
  options: QuestionOption[];
  isActive: boolean;
}

const EMPTY_FORM: QuestionFormData = {
  questionText: '',
  questionTextEn: '',
  importanceLevel: 'medium',
  options: [
    { value: 1, label: '', labelEn: '' },
    { value: 2, label: '', labelEn: '' },
  ],
  isActive: true,
};

// ── Sortable Question Card ───────────────────────────────────────────────

function SortableQuestionCard({
  question,
  onEdit,
  onDelete,
}: {
  question: QuizQuestion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <button
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              type="button"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            {/* Question content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 font-mono">
                  #{question.sortOrder}
                </span>
                <Badge
                  variant={
                    IMPORTANCE_BADGE_VARIANTS[question.importanceLevel]
                  }
                >
                  {IMPORTANCE_LABELS[question.importanceLevel]}
                </Badge>
                <Badge variant={question.isActive ? 'success' : 'outline'}>
                  {question.isActive ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
              <p className="font-medium text-sm mb-2">
                {question.questionText}
              </p>
              {question.questionTextEn && (
                <p className="text-xs text-gray-400 mb-2" dir="ltr">
                  {question.questionTextEn}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {question.options.map((opt) => (
                  <span
                    key={opt.value}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                  >
                    {opt.value}. {opt.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Quiz Responses Section ───────────────────────────────────────────────

const IMPORTANCE_ICONS: Record<number, string> = { 1: '⬇', 2: '➡', 3: '⬆' };
const IMPORTANCE_NAMES: Record<number, string> = { 1: 'נמוכה', 2: 'בינונית', 3: 'גבוהה' };

function QuizResponsesSection({ electionId }: { electionId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: responsesRes, isLoading } = useQuery({
    queryKey: ['quiz-responses', electionId],
    queryFn: () =>
      api.get<{ data: QuizResponse[]; total: number }>(
        `/elections/${electionId}/quiz/responses`
      ),
  });

  // Reuse the same query key — TanStack Query deduplicates
  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', electionId],
    queryFn: () =>
      api.get<QuizQuestion[]>(`/elections/${electionId}/quiz`),
  });

  // Build a lookup: questionId → question
  const questionMap = useMemo(() => {
    const map = new Map<string, QuizQuestion>();
    for (const q of questions) map.set(q.id, q);
    return map;
  }, [questions]);

  const responses = responsesRes?.data ?? [];
  const total = responsesRes?.total ?? 0;

  if (isLoading) {
    return (
      <div className="mt-8">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">תוצאות משתמשים</h2>
        <Badge variant="secondary">{total} תשובות</Badge>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-white rounded-lg border">
          <p>אין תוצאות עדיין</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-medium">משתמש</th>
                <th className="text-right px-4 py-3 font-medium">תאריך</th>
                <th className="text-right px-4 py-3 font-medium">התאמה מובילה</th>
                <th className="text-center px-4 py-3 font-medium">אחוז</th>
                <th className="text-center px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {responses.map((response) => {
                const topMatch = response.matchResults?.[0];
                const isExpanded = expandedId === response.id;
                const userName =
                  response.user?.displayName ||
                  response.user?.phone ||
                  response.user?.email ||
                  'אנונימי';

                return (
                  <Fragment key={response.id}>
                    <tr
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : response.id)
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {response.user?.avatarUrl ? (
                            <img
                              src={response.user.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                              {userName.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500" dir="ltr">
                        {response.completedAt
                          ? format(
                              new Date(response.completedAt),
                              'dd/MM/yyyy HH:mm'
                            )
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {topMatch?.candidateName || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {topMatch ? (
                          <Badge
                            variant={
                              topMatch.matchPercentage >= 80
                                ? 'success'
                                : topMatch.matchPercentage >= 60
                                ? 'warning'
                                : 'outline'
                            }
                          >
                            {topMatch.matchPercentage}%
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400">
                        {isExpanded ? '▲' : '▼'}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50/50 px-4 py-3">
                          {/* Match Results */}
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">
                              התאמות למועמדים
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {response.matchResults.map((match, idx) => (
                                <div
                                  key={match.candidateId}
                                  className="flex items-center justify-between bg-white rounded-md px-3 py-2 border"
                                >
                                  <span className="text-sm">
                                    <span className="text-gray-400 text-xs ml-1">
                                      #{idx + 1}
                                    </span>
                                    {match.candidateName || match.candidateId.slice(0, 8)}
                                  </span>
                                  <Badge
                                    variant={
                                      match.matchPercentage >= 80
                                        ? 'success'
                                        : match.matchPercentage >= 60
                                        ? 'warning'
                                        : 'outline'
                                    }
                                  >
                                    {match.matchPercentage}%
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* User Answers Detail */}
                          {response.answers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-2">
                                תשובות ({response.answers.length} שאלות)
                              </p>
                              <div className="bg-white rounded-md border overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="text-right px-3 py-2 font-medium">
                                        שאלה
                                      </th>
                                      <th className="text-center px-3 py-2 font-medium w-24">
                                        תשובה
                                      </th>
                                      <th className="text-center px-3 py-2 font-medium w-24">
                                        חשיבות
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {response.answers.map((ans) => {
                                      const question = questionMap.get(ans.questionId);
                                      const option = question?.options.find(
                                        (o) => o.value === ans.selectedValue
                                      );
                                      return (
                                        <tr key={ans.questionId}>
                                          <td className="px-3 py-2 text-gray-700">
                                            {question?.questionText ||
                                              ans.questionId.slice(0, 8)}
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                                              {option?.label || ans.selectedValue}
                                              <span className="text-blue-400">
                                                ({ans.selectedValue})
                                              </span>
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span className="text-gray-500">
                                              {IMPORTANCE_ICONS[ans.importance] || ''}{' '}
                                              {IMPORTANCE_NAMES[ans.importance] || ans.importance}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────

export default function QuizEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const electionId = params.electionId as string;

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormData>(EMPTY_FORM);

  // ── Confirm dialog ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: (() => void) | null;
  }>({
    open: false,
    title: '',
    description: '',
    action: null,
  });

  // ── Candidate positions state ──
  const [positionChanges, setPositionChanges] = useState<
    Record<string, Record<string, number>>
  >({});

  // ── Queries ──
  const { data: election } = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => api.get<PrimaryElection>(`/elections/${electionId}`),
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions', electionId],
    queryFn: () =>
      api.get<QuizQuestion[]>(`/elections/${electionId}/quiz`),
  });

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates', electionId],
    queryFn: () =>
      api.get<PrimaryCandidate[]>(`/candidates/election/${electionId}`),
  });

  // ── Sorted questions ──
  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.sortOrder - b.sortOrder),
    [questions]
  );

  // ── DnD ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: Partial<QuizQuestion>) =>
      api.post<QuizQuestion>(`/elections/${electionId}/quiz`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quiz-questions', electionId],
      });
      toast.success('השאלה נוצרה בהצלחה');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה ביצירת השאלה'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<QuizQuestion>;
    }) => api.put<QuizQuestion>(`/elections/${electionId}/quiz/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quiz-questions', electionId],
      });
      toast.success('השאלה עודכנה בהצלחה');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בעדכון השאלה'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/elections/${electionId}/quiz/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quiz-questions', electionId],
      });
      toast.success('השאלה נמחקה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה במחיקת השאלה'),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.put(`/elections/${electionId}/quiz/reorder`, { orderedIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['quiz-questions', electionId],
      });
    },
    onError: (err: Error) => toast.error(err.message || 'שגיאה בשינוי הסדר'),
  });

  const savePositionsMutation = useMutation({
    mutationFn: ({
      candidateId,
      quizPositions,
    }: {
      candidateId: string;
      quizPositions: Record<string, number>;
    }) => api.put(`/candidates/${candidateId}`, { quizPositions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', electionId] });
      toast.success('עמדות המועמד נשמרו');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה בשמירת העמדות'),
  });

  // ── Handlers ──

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function scrollToForm() {
    setTimeout(() => {
      document.getElementById('quiz-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  function handleAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(question: QuizQuestion) {
    setEditingId(question.id);
    setForm({
      questionText: question.questionText,
      questionTextEn: question.questionTextEn || '',
      importanceLevel: question.importanceLevel,
      options: question.options.map((o) => ({ ...o })),
      isActive: question.isActive,
    });
    setShowForm(true);
    scrollToForm();
  }

  function handleDelete(question: QuizQuestion) {
    setConfirmDialog({
      open: true,
      title: 'מחיקת שאלה',
      description: `האם למחוק את השאלה "${question.questionText}"?`,
      action: () => deleteMutation.mutate(question.id),
    });
  }

  function handleConfirmDialog() {
    confirmDialog.action?.();
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleCancelDialog() {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }

  function handleSave() {
    if (!form.questionText.trim()) {
      toast.error('יש למלא את טקסט השאלה');
      return;
    }
    if (form.options.length < 2) {
      toast.error('יש להוסיף לפחות 2 אפשרויות');
      return;
    }
    if (form.options.some((o) => !o.label.trim())) {
      toast.error('יש למלא את כל שדות האפשרויות');
      return;
    }

    const payload: Partial<QuizQuestion> = {
      questionText: form.questionText.trim(),
      questionTextEn: form.questionTextEn.trim() || undefined,
      importanceLevel: form.importanceLevel,
      options: form.options.map((o) => ({
        value: o.value,
        label: o.label.trim(),
        labelEn: o.labelEn?.trim() || undefined,
      })),
      isActive: form.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate({
        ...payload,
        sortOrder: sortedQuestions.length + 1,
      });
    }
  }

  function handleAddOption() {
    const nextValue =
      form.options.length > 0
        ? Math.max(...form.options.map((o) => o.value)) + 1
        : 1;
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { value: nextValue, label: '', labelEn: '' }],
    }));
  }

  function handleRemoveOption(index: number) {
    if (form.options.length <= 2) {
      toast.error('חייבות להיות לפחות 2 אפשרויות');
      return;
    }
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  function handleOptionChange(
    index: number,
    field: 'label' | 'labelEn' | 'value',
    value: string | number
  ) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) =>
        i === index ? { ...o, [field]: value } : o
      ),
    }));
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id);
      const newIndex = sortedQuestions.findIndex((q) => q.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedQuestions, oldIndex, newIndex);
      const orderedIds = reordered.map((q) => q.id);
      reorderMutation.mutate(orderedIds);
    },
    [sortedQuestions, reorderMutation]
  );

  // ── Candidate positions handlers ──

  function handlePositionChange(
    candidateId: string,
    questionId: string,
    value: string
  ) {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 5))
      return;

    setPositionChanges((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] || {}),
        [questionId]: numValue,
      },
    }));
  }

  function getCandidatePosition(
    candidate: PrimaryCandidate,
    questionId: string
  ): number | '' {
    if (
      positionChanges[candidate.id] &&
      questionId in positionChanges[candidate.id]
    ) {
      const val = positionChanges[candidate.id][questionId];
      return val === 0 ? '' : val;
    }
    const existing = candidate.quizPositions?.[questionId];
    return existing ?? '';
  }

  function handleSavePositions(candidate: PrimaryCandidate) {
    const changes = positionChanges[candidate.id];
    if (!changes) return;

    const mergedPositions: Record<string, number> = {
      ...(candidate.quizPositions || {}),
    };

    for (const [qId, val] of Object.entries(changes)) {
      if (val === 0) {
        delete mergedPositions[qId];
      } else {
        mergedPositions[qId] = val;
      }
    }

    savePositionsMutation.mutate({
      candidateId: candidate.id,
      quizPositions: mergedPositions,
    });

    // Clear local changes for this candidate
    setPositionChanges((prev) => {
      const next = { ...prev };
      delete next[candidate.id];
      return next;
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const activeQuestions = sortedQuestions.filter((q) => q.isActive);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/primaries/quiz')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              שאלון - {election?.title || '...'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sortedQuestions.length} שאלות ({activeQuestions.length} פעילות)
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף שאלה
        </Button>
      </div>

      {/* Questions List with DnD */}
      {questionsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : sortedQuestions.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400">
          <p>אין שאלות. לחץ על &quot;הוסף שאלה&quot; כדי להתחיל.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedQuestions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedQuestions.map((question) => (
              <SortableQuestionCard
                key={question.id}
                question={question}
                onEdit={() => handleEdit(question)}
                onDelete={() => handleDelete(question)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <Card id="quiz-form" className="mt-4 border-[#0099DB]/30">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'עריכת שאלה' : 'שאלה חדשה'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Text (Hebrew) */}
            <div className="space-y-2">
              <Label>טקסט השאלה *</Label>
              <Textarea
                value={form.questionText}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    questionText: e.target.value,
                  }))
                }
                placeholder="הכנס את טקסט השאלה..."
                rows={3}
              />
            </div>

            {/* Question Text (English) */}
            <div className="space-y-2">
              <Label>טקסט השאלה (אנגלית)</Label>
              <Textarea
                value={form.questionTextEn}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    questionTextEn: e.target.value,
                  }))
                }
                placeholder="Enter question text in English..."
                dir="ltr"
                rows={2}
              />
            </div>

            {/* Importance Level */}
            <div className="space-y-2">
              <Label>רמת חשיבות</Label>
              <Select
                value={form.importanceLevel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    importanceLevel: e.target
                      .value as QuizQuestion['importanceLevel'],
                  }))
                }
                className="w-full sm:w-48"
              >
                <option value="low">נמוכה</option>
                <option value="medium">בינונית</option>
                <option value="high">גבוהה</option>
              </Select>
            </div>

            {/* Options Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>אפשרויות</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  type="button"
                >
                  <Plus className="h-3 w-3 ml-1" />
                  הוסף אפשרות
                </Button>
              </div>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-xs text-gray-500 font-mono w-6 text-center shrink-0">
                      {option.value}
                    </span>
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        handleOptionChange(index, 'label', e.target.value)
                      }
                      placeholder="טקסט האפשרות..."
                      className="flex-1"
                    />
                    <Input
                      value={option.labelEn || ''}
                      onChange={(e) =>
                        handleOptionChange(index, 'labelEn', e.target.value)
                      }
                      placeholder="English..."
                      dir="ltr"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveOption(index)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* isActive */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
              />
              <Label htmlFor="isActive">פעיל</Label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 ml-1" />
                {isSaving ? 'שומר...' : editingId ? 'עדכן שאלה' : 'צור שאלה'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate Positions Matrix */}
      {activeQuestions.length > 0 && candidates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">מטריצת עמדות מועמדים</h2>
          <p className="text-sm text-gray-500 mb-4">
            הזן ציון 1-5 עבור עמדת כל מועמד בכל שאלה
          </p>
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-3 font-medium sticky right-0 bg-gray-50 z-10 min-w-[150px]">
                      מועמד
                    </th>
                    {activeQuestions.map((q) => (
                      <th
                        key={q.id}
                        className="text-center px-3 py-3 font-medium min-w-[120px]"
                      >
                        <div
                          className="text-xs leading-tight"
                          title={q.questionText}
                        >
                          {q.questionText.length > 30
                            ? `${q.questionText.slice(0, 30)}...`
                            : q.questionText}
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 font-medium min-w-[80px]">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {candidatesLoading ? (
                    <tr>
                      <td
                        colSpan={activeQuestions.length + 2}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        טוען מועמדים...
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => {
                      const hasChanges = !!positionChanges[candidate.id];
                      return (
                        <tr
                          key={candidate.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium sticky right-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                              {candidate.photoUrl && (
                                <img
                                  src={candidate.photoUrl}
                                  alt={candidate.fullName}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                              )}
                              <span>{candidate.fullName}</span>
                            </div>
                          </td>
                          {activeQuestions.map((q) => (
                            <td key={q.id} className="px-3 py-2 text-center">
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                value={getCandidatePosition(candidate, q.id)}
                                onChange={(e) =>
                                  handlePositionChange(
                                    candidate.id,
                                    q.id,
                                    e.target.value
                                  )
                                }
                                className="w-16 mx-auto text-center"
                                dir="ltr"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSavePositions(candidate)}
                              disabled={
                                !hasChanges ||
                                savePositionsMutation.isPending
                              }
                            >
                              {savePositionsMutation.isPending
                                ? '...'
                                : 'שמור'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Responses Section */}
      <QuizResponsesSection electionId={electionId} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={handleConfirmDialog}
        onCancel={handleCancelDialog}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmLabel="מחק"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
