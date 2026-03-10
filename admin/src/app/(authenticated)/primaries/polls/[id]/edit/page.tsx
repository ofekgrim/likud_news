'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  textEn?: string;
  voteCount: number;
}

interface CommunityPoll {
  id: string;
  question: string;
  questionEn?: string;
  options: PollOption[];
  totalVotes: number;
  isPinned: boolean;
  isActive: boolean;
  closesAt?: string;
  createdAt: string;
}

interface PollOptionForm {
  id?: string;
  text: string;
  textEn: string;
  voteCount: number;
}

export default function EditPollPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const pollId = params.id as string;

  const { data: poll, isLoading } = useQuery({
    queryKey: ['community-poll', pollId],
    queryFn: () => api.get<CommunityPoll>(`/community-polls/${pollId}`),
  });

  const [form, setForm] = useState({
    question: '',
    questionEn: '',
    closesAt: '',
    isPinned: false,
    isActive: true,
  });

  const [options, setOptions] = useState<PollOptionForm[]>([
    { text: '', textEn: '', voteCount: 0 },
    { text: '', textEn: '', voteCount: 0 },
  ]);

  useEffect(() => {
    if (poll) {
      setForm({
        question: poll.question,
        questionEn: poll.questionEn || '',
        closesAt: poll.closesAt
          ? new Date(poll.closesAt).toISOString().slice(0, 16)
          : '',
        isPinned: poll.isPinned,
        isActive: poll.isActive,
      });
      setOptions(
        poll.options.map((o) => ({
          id: o.id,
          text: o.text,
          textEn: o.textEn || '',
          voteCount: o.voteCount,
        }))
      );
    }
  }, [poll]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/community-polls/${pollId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-polls'] });
      queryClient.invalidateQueries({ queryKey: ['community-poll', pollId] });
      toast.success('הסקר עודכן בהצלחה');
      router.push('/primaries/polls');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function addOption() {
    setOptions([...options, { text: '', textEn: '', voteCount: 0 }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      toast.error('נדרשות לפחות 2 אפשרויות');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, field: 'text' | 'textEn', value: string) {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validOptions = options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      toast.error('נדרשות לפחות 2 אפשרויות עם טקסט');
      return;
    }

    const payload: Record<string, unknown> = {
      question: form.question,
      questionEn: form.questionEn || undefined,
      options: validOptions.map((o) => ({
        id: o.id || undefined,
        text: o.text.trim(),
        textEn: o.textEn.trim() || undefined,
      })),
      isPinned: form.isPinned,
      isActive: form.isActive,
      closesAt: form.closesAt || undefined,
    };
    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">עריכת סקר</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ביטול
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'שומר...' : 'עדכן סקר'}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Card 1 — Poll Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">פרטי הסקר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>שאלה (עברית) *</Label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="מה השאלה?"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>שאלה (אנגלית)</Label>
              <Textarea
                value={form.questionEn}
                onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
                dir="ltr"
                placeholder="Question in English"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>תאריך סגירה</Label>
              <Input
                type="datetime-local"
                value={form.closesAt}
                onChange={(e) => setForm({ ...form, closesAt: e.target.value })}
                dir="ltr"
              />
              <p className="text-xs text-gray-400">
                אופציונלי. הסקר ייסגר אוטומטית בתאריך זה.
              </p>
            </div>

            {/* Total votes info */}
            {poll && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  סה&quot;כ הצבעות: <strong>{poll.totalVotes.toLocaleString()}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2 — Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">אפשרויות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <div
                key={option.id || index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder={`אפשרות ${index + 1}`}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6" />
                    <Input
                      value={option.textEn}
                      onChange={(e) => updateOption(index, 'textEn', e.target.value)}
                      placeholder={`Option ${index + 1} in English`}
                      dir="ltr"
                    />
                  </div>
                  {/* Vote count display (read-only) */}
                  {option.voteCount > 0 && (
                    <div className="flex items-center gap-2 mr-6">
                      <span className="text-xs text-gray-500">
                        הצבעות: {option.voteCount.toLocaleString()}
                        {poll && poll.totalVotes > 0 && (
                          <span className="mr-1 text-gray-400">
                            ({Math.round((option.voteCount / poll.totalVotes) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 text-red-500 hover:text-red-700 hover:border-red-300"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              <Plus className="h-4 w-4 ml-1" />
              הוסף אפשרות +
            </Button>
          </CardContent>
        </Card>

        {/* Card 3 — Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">הגדרות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
              />
              <span className="text-sm">מוצמד למעלה</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
              />
              <span className="text-sm">פעיל</span>
            </label>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
