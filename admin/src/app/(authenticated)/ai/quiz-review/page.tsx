'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AiGeneratedQuiz, AiQuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Pencil,
  RefreshCcw,
  ExternalLink,
} from 'lucide-react';

type TabKey = 'pending' | 'approved' | 'rejected';

const TAB_LABELS: Record<TabKey, string> = {
  pending: 'ממתינים',
  approved: 'אושרו',
  rejected: 'נדחו',
};

const STATUS_BADGE_VARIANTS: Record<
  TabKey,
  'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export default function AiQuizReviewPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    quizId: string;
    questionIndex: number;
  } | null>(null);
  const [editValues, setEditValues] = useState<AiQuizQuestion | null>(null);

  // ── Fetch quizzes ──
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['ai-quizzes', activeTab],
    queryFn: () =>
      api.get<AiGeneratedQuiz[]>(
        activeTab === 'pending'
          ? '/ai/quiz/pending'
          : `/ai/quiz?status=${activeTab}`
      ),
  });

  // ── Generate quiz ──
  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<AiGeneratedQuiz>('/ai/quiz/generate', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-quizzes'] });
      toast.success('חידון חדש נוצר בהצלחה');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה ביצירת חידון'),
  });

  // ── Approve quiz ──
  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<void>(`/ai/quiz/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-quizzes'] });
      toast.success('החידון אושר ונשלח למערכת החידון היומי');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה באישור החידון'),
  });

  // ── Reject quiz ──
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<void>(`/ai/quiz/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-quizzes'] });
      toast.success('החידון נדחה');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה בדחיית החידון'),
  });

  function toggleExpand(quizId: string) {
    setExpandedQuizId((prev) => (prev === quizId ? null : quizId));
    setEditingQuestion(null);
    setEditValues(null);
  }

  function startEditing(quizId: string, questionIndex: number, question: AiQuizQuestion) {
    setEditingQuestion({ quizId, questionIndex });
    setEditValues({ ...question, options: [...question.options] });
  }

  function cancelEditing() {
    setEditingQuestion(null);
    setEditValues(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">סקירת חידונים - AI</h1>
          <p className="text-sm text-gray-500 mt-1">
            סקירה ואישור חידונים שנוצרו על ידי AI
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <RefreshCcw className="h-4 w-4 ml-1 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 ml-1" />
          )}
          {generateMutation.isPending ? 'יוצר חידון...' : 'חידון חדש'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-white shadow-sm font-medium text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Quiz List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border shadow-sm p-6">
              <TableRowSkeleton columns={4} />
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>
            {activeTab === 'pending'
              ? 'אין חידונים ממתינים לסקירה'
              : activeTab === 'approved'
              ? 'אין חידונים מאושרים'
              : 'אין חידונים שנדחו'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const isExpanded = expandedQuizId === quiz.id;
            return (
              <Card key={quiz.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpand(quiz.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        חידון · {quiz.questions.length} שאלות
                      </CardTitle>
                      <Badge variant={STATUS_BADGE_VARIANTS[quiz.status]}>
                        {TAB_LABELS[quiz.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(quiz.generatedAt).toLocaleDateString('he-IL')}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-6">
                      {quiz.questions.map((question, qIndex) => {
                        const isEditingThis =
                          editingQuestion?.quizId === quiz.id &&
                          editingQuestion?.questionIndex === qIndex;

                        return (
                          <div
                            key={qIndex}
                            className="border rounded-lg p-4 bg-gray-50/50"
                          >
                            {/* Question header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <span className="text-xs font-medium text-gray-400 mb-1 block">
                                  שאלה {qIndex + 1}
                                </span>
                                {isEditingThis && editValues ? (
                                  <Input
                                    value={editValues.question}
                                    onChange={(e) =>
                                      setEditValues({
                                        ...editValues,
                                        question: e.target.value,
                                      })
                                    }
                                    className="text-sm font-medium"
                                  />
                                ) : (
                                  <p className="font-medium text-sm">
                                    {question.question}
                                  </p>
                                )}
                              </div>
                              {quiz.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isEditingThis) {
                                      cancelEditing();
                                    } else {
                                      startEditing(quiz.id, qIndex, question);
                                    }
                                  }}
                                  title={isEditingThis ? 'ביטול עריכה' : 'עריכה'}
                                >
                                  {isEditingThis ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Pencil className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>

                            {/* Options */}
                            <div className="space-y-2 mb-3">
                              {(isEditingThis && editValues
                                ? editValues.options
                                : question.options
                              ).map((option, oIndex) => {
                                const isCorrect = isEditingThis && editValues
                                  ? oIndex === editValues.correctIndex
                                  : oIndex === question.correctIndex;

                                return (
                                  <div
                                    key={oIndex}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                                      isCorrect
                                        ? 'bg-green-50 border border-green-200 text-green-800'
                                        : 'bg-white border border-gray-200'
                                    }`}
                                  >
                                    <span className="font-mono text-xs text-gray-400 w-5">
                                      {String.fromCharCode(1488 + oIndex)}.
                                    </span>
                                    {isEditingThis && editValues ? (
                                      <Input
                                        value={option}
                                        onChange={(e) => {
                                          const newOptions = [...editValues.options];
                                          newOptions[oIndex] = e.target.value;
                                          setEditValues({
                                            ...editValues,
                                            options: newOptions,
                                          });
                                        }}
                                        className="flex-1 h-7 text-sm border-0 bg-transparent p-0"
                                      />
                                    ) : (
                                      <span className="flex-1">{option}</span>
                                    )}
                                    {isCorrect && (
                                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2 mb-2">
                              <span className="text-xs font-medium text-blue-600 block mb-0.5">
                                הסבר
                              </span>
                              {isEditingThis && editValues ? (
                                <Input
                                  value={editValues.explanation}
                                  onChange={(e) =>
                                    setEditValues({
                                      ...editValues,
                                      explanation: e.target.value,
                                    })
                                  }
                                  className="text-xs border-0 bg-transparent p-0 h-6"
                                />
                              ) : (
                                <p className="text-xs text-blue-800">
                                  {question.explanation}
                                </p>
                              )}
                            </div>

                            {/* Source article link */}
                            {question.sourceArticleId && (
                              <a
                                href={`/articles?id=${question.sourceArticleId}`}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                כתבת מקור
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    {quiz.status === 'pending' && (
                      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
                        <Button
                          onClick={() => approveMutation.mutate(quiz.id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 ml-1" />
                          אשר חידון
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(quiz.id)}
                          disabled={
                            approveMutation.isPending || rejectMutation.isPending
                          }
                        >
                          <X className="h-4 w-4 ml-1" />
                          דחה חידון
                        </Button>
                      </div>
                    )}

                    {quiz.reviewedAt && (
                      <p className="text-xs text-gray-400 mt-3">
                        נסקר ב-
                        {new Date(quiz.reviewedAt).toLocaleDateString('he-IL')}{' '}
                        {new Date(quiz.reviewedAt).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {quizzes.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          <span>
            סה&quot;כ: {quizzes.length} חידונים
          </span>
        </div>
      )}
    </div>
  );
}
