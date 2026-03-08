'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowRight, Send, Users, Eye, Search, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePicker } from '@/components/image-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
  imageUrlTemplate?: string;
  contentType: string;
  variables: { name: string; required: boolean; description: string }[];
  defaultAudience: Record<string, unknown>;
}

interface ArticleResult {
  id: string;
  title: string;
  slug: string;
  heroImageUrl?: string;
}

type AudienceType = 'all' | 'targeted' | 'specific_users';

export default function SendNotificationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [roles, setRoles] = useState<string[]>([]);
  const [membershipStatuses, setMembershipStatuses] = useState<string[]>([]);
  const [specificUserIds, setSpecificUserIds] = useState('');
  const [notifPrefKey, setNotifPrefKey] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleResult | null>(null);

  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: () => api.get<Template[]>('/notifications/templates'),
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const { data: articleResults } = useQuery({
    queryKey: ['articles-search', articleSearch],
    queryFn: () => api.get<ArticleResult[]>(`/articles?search=${encodeURIComponent(articleSearch)}&limit=5`),
    enabled: articleSearch.length >= 2,
  });

  const previewMutation = useMutation({
    mutationFn: (audience: Record<string, unknown>) =>
      api.post<{ count: number }>('/notifications/send/preview-audience', audience),
    onSuccess: (data) => setAudienceCount(data.count),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/notifications/send', payload),
    onSuccess: () => {
      toast.success('ההתראה נשלחה בהצלחה');
      router.push('/notifications/history');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function buildAudience() {
    const audience: Record<string, unknown> = { type: audienceType };
    if (audienceType === 'targeted') {
      if (roles.length) audience.roles = roles;
      if (membershipStatuses.length) audience.membershipStatuses = membershipStatuses;
      if (notifPrefKey) audience.notificationPrefKey = notifPrefKey;
    }
    if (audienceType === 'specific_users' && specificUserIds.trim()) {
      audience.userIds = specificUserIds.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return audience;
  }

  function handlePreview() {
    previewMutation.mutate(buildAudience());
  }

  function handleSend() {
    const audience = buildAudience();
    const payload: Record<string, unknown> = { audience };

    if (mode === 'template' && selectedTemplateId) {
      payload.templateId = selectedTemplateId;
      payload.variables = variables;
      payload.contentType = selectedTemplate?.contentType;
    } else {
      if (!title.trim() || !body.trim()) {
        toast.error('כותרת ותוכן נדרשים');
        return;
      }
      payload.title = title;
      payload.body = body;
      if (imageUrl) payload.imageUrl = imageUrl;
      payload.contentType = 'custom';
    }

    if (selectedArticle) {
      payload.contentId = selectedArticle.id;
      payload.data = { article_slug: selectedArticle.slug };
      if (!payload.contentType || payload.contentType === 'custom') {
        payload.contentType = 'article';
      }
    }

    if (imageUrl) payload.imageUrl = imageUrl;

    if (!sendNow && scheduledAt) {
      payload.scheduledAt = new Date(scheduledAt).toISOString();
    }

    sendMutation.mutate(payload);
  }

  function handleTemplateSelect(id: string) {
    setSelectedTemplateId(id);
    setVariables({});
    const tmpl = templates?.find((t) => t.id === id);
    if (tmpl?.defaultAudience) {
      const da = tmpl.defaultAudience as Record<string, unknown>;
      if (da.type) setAudienceType(da.type as AudienceType);
      if (da.notificationPrefKey) setNotifPrefKey(da.notificationPrefKey as string);
    }
  }

  function handleArticleSelect(article: ArticleResult) {
    setSelectedArticle(article);
    setArticleSearch('');
    // Auto-fill image from article hero image
    if (article.heroImageUrl && !imageUrl) {
      setImageUrl(article.heroImageUrl);
    }
    // Auto-fill template variables if in template mode
    if (mode === 'template' && selectedTemplate) {
      setVariables((prev) => ({
        ...prev,
        article_title: article.title,
        article_slug: article.slug,
        ...(article.heroImageUrl && { hero_image_url: article.heroImageUrl }),
      }));
    }
    // Auto-fill custom mode fields
    if (mode === 'custom') {
      if (!title) setTitle(article.title);
    }
  }

  const roleOptions = [
    { value: 'guest', label: 'אורח' },
    { value: 'member', label: 'חבר' },
    { value: 'verified_member', label: 'חבר מאומת' },
  ];

  const statusOptions = [
    { value: 'unverified', label: 'לא מאומת' },
    { value: 'pending', label: 'ממתין' },
    { value: 'verified', label: 'מאומת' },
    { value: 'expired', label: 'פג תוקף' },
  ];

  const prefKeyOptions = [
    { value: '', label: 'ללא סינון' },
    { value: 'breaking_news', label: 'מבזקים' },
    { value: 'article_updates', label: 'כתבות' },
    { value: 'membership_updates', label: 'חברות' },
    { value: 'campaign_events', label: 'אירועים' },
  ];

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notifications">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">שלח התראה</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={mode === 'template' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('template')}
                >
                  שימוש בתבנית
                </Button>
                <Button
                  variant={mode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('custom')}
                >
                  מותאם אישית
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Template mode */}
          {mode === 'template' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">בחר תבנית</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">בחר תבנית...</option>
                  {templates?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.titleTemplate}
                    </option>
                  ))}
                </select>

                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-medium text-gray-500">משתנים</p>
                    {selectedTemplate.variables.map((v) => (
                      <div key={v.name} className="space-y-1">
                        <Label>
                          {v.description || v.name}
                          {v.required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        <Input
                          value={variables[v.name] || ''}
                          onChange={(e) =>
                            setVariables({ ...variables, [v.name]: e.target.value })
                          }
                          placeholder={`{{${v.name}}}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom mode */}
          {mode === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">תוכן ההתראה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>כותרת *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="כותרת ההתראה"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תוכן *</Label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="תוכן ההתראה"
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[100px] resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Article Picker — for linking notification to an article */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">קישור לכתבה (אופציונלי)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedArticle ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {selectedArticle.heroImageUrl && (
                    <img
                      src={selectedArticle.heroImageUrl}
                      alt=""
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedArticle.title}</p>
                    <p className="text-xs text-gray-500" dir="ltr">{selectedArticle.slug}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedArticle(null)}
                  >
                    הסר
                  </Button>
                  {selectedArticle.heroImageUrl && !imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImageUrl(selectedArticle.heroImageUrl!)}
                    >
                      <ImageIcon className="h-3 w-3 ml-1" />
                      השתמש בתמונה
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    placeholder="חפש כתבה לפי כותרת..."
                    className="pr-9"
                  />
                  {articleResults && articleResults.length > 0 && articleSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {articleResults.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => handleArticleSelect(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-right"
                        >
                          {a.heroImageUrl && (
                            <img src={a.heroImageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="truncate">{a.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Image Picker — available in both modes */}
              <ImagePicker
                value={imageUrl}
                onChange={setImageUrl}
                label="תמונה לנוטיפיקציה"
              />
            </CardContent>
          </Card>

          {/* Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">קהל יעד</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(['all', 'targeted', 'specific_users'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={audienceType === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAudienceType(t)}
                  >
                    {t === 'all' ? 'כולם' : t === 'targeted' ? 'ממוקד' : 'משתמשים ספציפיים'}
                  </Button>
                ))}
              </div>

              {audienceType === 'targeted' && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>תפקיד</Label>
                    <div className="flex gap-2 flex-wrap">
                      {roleOptions.map((r) => (
                        <label key={r.value} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={roles.includes(r.value)}
                            onChange={(e) =>
                              setRoles(
                                e.target.checked
                                  ? [...roles, r.value]
                                  : roles.filter((v) => v !== r.value),
                              )
                            }
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>סטטוס חברות</Label>
                    <div className="flex gap-2 flex-wrap">
                      {statusOptions.map((s) => (
                        <label key={s.value} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={membershipStatuses.includes(s.value)}
                            onChange={(e) =>
                              setMembershipStatuses(
                                e.target.checked
                                  ? [...membershipStatuses, s.value]
                                  : membershipStatuses.filter((v) => v !== s.value),
                              )
                            }
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>העדפת התראות</Label>
                    <select
                      value={notifPrefKey}
                      onChange={(e) => setNotifPrefKey(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      {prefKeyOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {audienceType === 'specific_users' && (
                <div className="space-y-2 pt-2">
                  <Label>מזהי משתמשים (מופרדים בפסיק)</Label>
                  <textarea
                    value={specificUserIds}
                    onChange={(e) => setSpecificUserIds(e.target.value)}
                    placeholder="uuid-1, uuid-2, uuid-3"
                    className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] resize-y"
                    dir="ltr"
                  />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                <Eye className="h-4 w-4 ml-1" />
                {previewMutation.isPending ? 'בודק...' : 'בדוק גודל קהל'}
              </Button>

              {audienceCount !== null && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    <strong>{audienceCount.toLocaleString()}</strong> מכשירים תואמים
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">תזמון</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={sendNow ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendNow(true)}
                >
                  שלח עכשיו
                </Button>
                <Button
                  variant={!sendNow ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendNow(false)}
                >
                  תזמן
                </Button>
              </div>

              {!sendNow && (
                <div className="space-y-2">
                  <Label>תאריך ושעה</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    dir="ltr"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">תצוגה מקדימה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0099DB] flex items-center justify-center text-white text-xs font-bold">
                    מ
                  </div>
                  <span className="text-xs text-gray-500">מצודת הליכוד</span>
                </div>
                <p className="font-semibold text-sm">
                  {mode === 'template' && selectedTemplate
                    ? interpolate(selectedTemplate.titleTemplate, variables)
                    : title || 'כותרת ההתראה'}
                </p>
                <p className="text-sm text-gray-600">
                  {mode === 'template' && selectedTemplate
                    ? interpolate(selectedTemplate.bodyTemplate, variables)
                    : body || 'תוכן ההתראה'}
                </p>
                {imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img src={imageUrl} alt="notification" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>מצב</span>
                  <Badge variant="outline">
                    {mode === 'template' ? 'תבנית' : 'מותאם'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>תזמון</span>
                  <span>{sendNow ? 'מיידי' : scheduledAt || 'לא נבחר'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>קהל</span>
                  <span>
                    {audienceType === 'all'
                      ? 'כולם'
                      : audienceType === 'targeted'
                        ? 'ממוקד'
                        : 'ספציפי'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSend}
            disabled={sendMutation.isPending}
          >
            <Send className="h-4 w-4 ml-2" />
            {sendMutation.isPending
              ? 'שולח...'
              : sendNow
                ? 'שלח עכשיו'
                : 'תזמן שליחה'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}
