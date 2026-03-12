'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { getCompanyAdvertisers, createCompanyAdvertiser } from '@/lib/api';
import { api } from '@/lib/api';
import type { CompanyAdvertiser } from '@/lib/types';

export default function AdvertisersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyAdvertiser | null>(null);
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    website: '',
    contactEmail: '',
    isActive: true,
  });

  const { data: advertisers = [], isLoading } = useQuery({
    queryKey: ['company-advertisers'],
    queryFn: getCompanyAdvertisers,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dto = {
        name: form.name,
        logoUrl: form.logoUrl || undefined,
        website: form.website || undefined,
        contactEmail: form.contactEmail || undefined,
        isActive: form.isActive,
      };
      if (editing) {
        return api.patch(`/ads/admin/company/advertisers/${editing.id}`, dto);
      }
      return createCompanyAdvertiser(dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-advertisers'] });
      setDialogOpen(false);
      setEditing(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', logoUrl: '', website: '', contactEmail: '', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (adv: CompanyAdvertiser) => {
    setEditing(adv);
    setForm({
      name: adv.name,
      logoUrl: adv.logoUrl || '',
      website: adv.website || '',
      contactEmail: adv.contactEmail || '',
      isActive: adv.isActive,
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">מפרסמים</h1>
            <p className="text-sm text-muted-foreground">ניהול חברות מפרסמות</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          מפרסם חדש
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">טוען...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">לוגו</TableHead>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">אתר</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisers.map((adv) => (
                <TableRow key={adv.id}>
                  <TableCell>
                    {adv.logoUrl ? (
                      <img src={adv.logoUrl} alt={adv.name} className="h-8 w-8 object-contain rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{adv.name}</TableCell>
                  <TableCell>
                    {adv.website ? (
                      <a href={adv.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        {adv.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{adv.contactEmail || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={adv.isActive ? 'default' : 'secondary'} className={adv.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                      {adv.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(adv)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {advertisers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    אין מפרסמים עדיין
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="max-w-md">
        <div dir="rtl">
        <DialogTitle>{editing ? 'עריכת מפרסם' : 'מפרסם חדש'}</DialogTitle>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="adv-name">שם מפרסם *</Label>
            <Input
              id="adv-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="שם החברה"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-logo">URL לוגו</Label>
            <Input
              id="adv-logo"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-website">אתר</Label>
            <Input
              id="adv-website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adv-email">אימייל</Label>
            <Input
              id="adv-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="contact@company.com"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="adv-active"
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: v })}
            />
            <Label htmlFor="adv-active">פעיל</Label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>ביטול</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'שומר...' : 'שמור'}
          </Button>
        </div>
        </div>
      </Dialog>
    </div>
  );
}
