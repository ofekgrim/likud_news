'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { fetchDailyQuizzes, createDailyQuiz, updateDailyQuiz, deleteDailyQuiz } from '@/lib/api';
import type { DailyQuizWithStats, DailyQuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface QuestionFormData {
  questionText: string;
  options: { label: string; isCorrect: boolean }[];
  linkedArticleId: string;
}

const emptyQuestion = (): QuestionFormData => ({
  questionText: '',
  options: [
    { label: '', isCorrect: true },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
  ],
  linkedArticleId: '',
});

interface QuizFormData {
  date: string;
  pointsReward: number;
  questions: QuestionFormData[];
}

const emptyForm = (): QuizFormData => ({
  date: new Date().toISOString().slice(0, 10),
  pointsReward: 20,
  questions: [emptyQuestion()],
});

export default function DailyQuizPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<DailyQuizWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState<QuizFormData>(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['daily-quizzes', page],
    queryFn: () => fetchDailyQuizzes(page, 20),
  });

  const createMutation = useMutation({
    mutationFn: (data: { date: string; questions: DailyQuizQuestion[]; pointsReward?: number }) =>
      createDailyQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-quizzes'] });
      toast.success('החידון נוצר בהצלחה');
      closeDialog();
    },
    onError: () => toast.error('שגיאה ביצירת החידון'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date: string; questions: DailyQuizQuestion[]; pointsReward?: number } }) =>
      updateDailyQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-quizzes'] });
      toast.success('החידון עודכן בהצלחה');
      closeDialog();
    },
    onError: () => toast.error('שגיאה בעדכון החידון'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDailyQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-quizzes'] });
      toast.success('החידון נמחק');
      setDeleteTarget(null);
    },
    onError: () => toast.error('שגיאה במחיקת החידון'),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingQuiz(null);
    setForm(emptyForm());
  }

  function openCreate() {
    setEditingQuiz(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(quiz: DailyQuizWithStats) {
    setEditingQuiz(quiz);
    setForm({
      date: quiz.date.slice(0, 10),
      pointsReward: quiz.pointsReward,
      questions: quiz.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })),
        linkedArticleId: q.linkedArticleId || '',
      })),
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const questions: DailyQuizQuestion[] = form.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      ...(q.linkedArticleId ? { linkedArticleId: q.linkedArticleId } : {}),
    }));

    const payload = {
      date: form.date,
      questions,
      pointsReward: form.pointsReward,
    };

    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function updateQuestion(qIndex: number, field: keyof QuestionFormData, value: string) {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[qIndex] = { ...questions[qIndex], [field]: value };
      return { ...prev, questions };
    });
  }

  function updateOption(qIndex: number, oIndex: number, field: 'label' | 'isCorrect', value: string | boolean) {
    setForm((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIndex].options];

      if (field === 'isCorrect') {
        // Only one correct answer per question
        options.forEach((o, i) => {
          options[i] = { ...o, isCorrect: i === oIndex };
        });
      } else {
        options[oIndex] = { ...options[oIndex], [field]: value };
      }

      questions[qIndex] = { ...questions[qIndex], options };
      return { ...prev, questions };
    });
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  }

  function removeQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">חידון יומי</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />
          חידון חדש
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium text-gray-500">תאריך</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">שאלות</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">נקודות</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">השלמות</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">ציון ממוצע</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 w-24">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))
            ) : data?.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-1">אין חידונים</p>
                  <p className="text-sm">צור חידון חדש כדי להתחיל</p>
                </td>
              </tr>
            ) : (
              data?.data.map((quiz, i) => (
                <tr key={quiz.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatDate(quiz.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {quiz.questions.length}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {quiz.pointsReward}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {quiz.completionCount?.toLocaleString() ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {quiz.averageScore != null ? `${Math.round(quiz.averageScore)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={quiz.isActive ? 'success' : 'outline'}>
                      {quiz.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(quiz)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(quiz.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
            <p className="text-sm text-gray-500">
              עמוד {data.page} מתוך {data.totalPages} ({data.total} חידונים)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                הקודם
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.totalPages ?? 1)}
              >
                הבא
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} className="max-w-2xl">
        <DialogTitle>{editingQuiz ? 'עריכת חידון' : 'חידון חדש'}</DialogTitle>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiz-date">תאריך</Label>
              <Input
                id="quiz-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="quiz-points">נקודות</Label>
              <Input
                id="quiz-points"
                type="number"
                min={0}
                value={form.pointsReward}
                onChange={(e) => setForm((prev) => ({ ...prev, pointsReward: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">שאלות</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-3.5 w-3.5 ml-1" />
                הוסף שאלה
              </Button>
            </div>

            {form.questions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">שאלה {qIndex + 1}</span>
                  {form.questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label>טקסט השאלה</Label>
                  <Input
                    dir="rtl"
                    placeholder="הקלד שאלה..."
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>תשובות</Label>
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={opt.isCorrect}
                        onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                        className="h-4 w-4 text-[#0099DB] focus:ring-[#0099DB]"
                        title="תשובה נכונה"
                      />
                      <Input
                        dir="rtl"
                        placeholder={`תשובה ${oIndex + 1}`}
                        value={opt.label}
                        onChange={(e) => updateOption(qIndex, oIndex, 'label', e.target.value)}
                        className="flex-1"
                        required
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">סמן את התשובה הנכונה באמצעות כפתור הרדיו</p>
                </div>

                <div>
                  <Label>מזהה כתבה מקושרת (אופציונלי)</Label>
                  <Input
                    placeholder="UUID של כתבה"
                    value={q.linkedArticleId}
                    onChange={(e) => updateQuestion(qIndex, 'linkedArticleId', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '...' : editingQuiz ? 'עדכן' : 'צור חידון'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="מחיקת חידון"
        description="האם למחוק את החידון? פעולה זו אינה הפיכה."
        confirmLabel="מחק"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
