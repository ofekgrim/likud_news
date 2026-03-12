'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PolicyStatement, MatcherCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { toast } from 'sonner';
import { ArrowRight, Save } from 'lucide-react';

// ── Category options ────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: MatcherCategory; label: string }[] = [
  { value: 'security', label: 'ביטחון' },
  { value: 'economy', label: 'כלכלה' },
  { value: 'society', label: 'חברה' },
  { value: 'law', label: 'חוק ומשפט' },
  { value: 'education', label: 'חינוך' },
  { value: 'foreign_policy', label: 'מדיניות חוץ' },
];

// ── Form state ──────────────────────────────────────────────────────────

interface StatementFormData {
  textHe: string;
  textEn: string;
  category: MatcherCategory;
  defaultWeight: number;
  sortOrder: number;
  electionId: string;
  isActive: boolean;
}

const EMPTY_FORM: StatementFormData = {
  textHe: '',
  textEn: '',
  category: 'security',
  defaultWeight: 1.0,
  sortOrder: 0,
  electionId: '',
  isActive: true,
};

// ── Main Page Component ─────────────────────────────────────────────────

export default function NewStatementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const editId = searchParams.get('edit');
  const presetElectionId = searchParams.get('electionId') || '';
  const isEditing = !!editId;

  const [form, setForm] = useState<StatementFormData>({
    ...EMPTY_FORM,
    electionId: presetElectionId,
  });

  // ── Fetch existing statement for editing ──
  const { data: existingStatement, isLoading: loadingStatement } = useQuery({
    queryKey: ['matcher-statement', editId],
    queryFn: async () => {
      // Fetch all statements for the election and find the one we want
      const statements = await api.get<PolicyStatement[]>(
        `/primaries/matcher/statements/${presetElectionId}`
      );
      return statements.find((s) => s.id === editId) || null;
    },
    enabled: isEditing && !!presetElectionId,
  });

  // ── Populate form when editing ──
  useEffect(() => {
    if (existingStatement) {
      setForm({
        textHe: existingStatement.textHe,
        textEn: existingStatement.textEn || '',
        category: existingStatement.category,
        defaultWeight: existingStatement.defaultWeight,
        sortOrder: existingStatement.sortOrder,
        electionId: existingStatement.electionId,
        isActive: existingStatement.isActive,
      });
    }
  }, [existingStatement]);

  // ── Create mutation ──
  const createMutation = useMutation({
    mutationFn: (data: Partial<PolicyStatement>) =>
      api.post<PolicyStatement>(
        '/primaries/matcher/admin/statements',
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['matcher-statements'],
      });
      toast.success('ההצהרה נוצרה בהצלחה');
      router.push('/primaries/matcher');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה ביצירת ההצהרה'),
  });

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: (data: Partial<PolicyStatement>) =>
      api.patch<PolicyStatement>(
        `/primaries/matcher/admin/statements/${editId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['matcher-statements'],
      });
      toast.success('ההצהרה עודכנה בהצלחה');
      router.push('/primaries/matcher');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'שגיאה בעדכון ההצהרה'),
  });

  // ── Form validation and submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.textHe.trim()) {
      toast.error('יש למלא את טקסט ההצהרה בעברית');
      return;
    }
    if (!form.electionId) {
      toast.error('יש לבחור בחירות');
      return;
    }
    if (form.defaultWeight < 0.5 || form.defaultWeight > 2.0) {
      toast.error('המשקל חייב להיות בין 0.5 ל-2.0');
      return;
    }

    const payload: Partial<PolicyStatement> = {
      textHe: form.textHe.trim(),
      textEn: form.textEn.trim() || undefined,
      category: form.category,
      defaultWeight: form.defaultWeight,
      sortOrder: form.sortOrder,
      electionId: form.electionId,
      isActive: form.isActive,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingStatement) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push('/primaries/matcher')}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'עריכת הצהרה' : 'הצהרה חדשה'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/primaries/matcher')}
          >
            ביטול
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 ml-1" />
            {isSaving ? 'שומר...' : isEditing ? 'עדכן' : 'צור הצהרה'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Hebrew Text */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">טקסט ההצהרה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>טקסט בעברית *</Label>
                <Textarea
                  value={form.textHe}
                  onChange={(e) =>
                    setForm({ ...form, textHe: e.target.value })
                  }
                  placeholder="הכנס את טקסט ההצהרה בעברית..."
                  rows={4}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>טקסט באנגלית</Label>
                <Textarea
                  value={form.textEn}
                  onChange={(e) =>
                    setForm({ ...form, textEn: e.target.value })
                  }
                  placeholder="Enter statement text in English..."
                  dir="ltr"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Election Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">שיוך</CardTitle>
            </CardHeader>
            <CardContent>
              <ElectionSelector
                value={form.electionId}
                onChange={(val) =>
                  setForm({ ...form, electionId: val || '' })
                }
                label="בחירות *"
                required
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">קטגוריה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>קטגוריה *</Label>
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as MatcherCategory,
                    })
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">הגדרות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>משקל ברירת מחדל (0.5 - 2.0)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="2.0"
                  value={form.defaultWeight}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultWeight: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  dir="ltr"
                />
                <p className="text-xs text-gray-400">
                  משקל גבוה יותר = השפעה חזקה יותר על תוצאת ההתאמה
                </p>
              </div>

              <div className="space-y-2">
                <Label>סדר תצוגה</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  dir="ltr"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#0099DB] focus:ring-[#0099DB]"
                />
                <span className="text-sm">פעיל</span>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
