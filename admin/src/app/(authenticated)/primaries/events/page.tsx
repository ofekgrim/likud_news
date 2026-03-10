'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Search, Trash2, MapPin, Calendar } from 'lucide-react';

interface CampaignEvent {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  location: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  candidateId?: string;
  candidate?: { id: string; fullName: string };
  rsvpCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function EventsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['campaign-events'],
    queryFn: () => api.get<{ data: CampaignEvent[] }>('/campaign-events'),
  });
  const events = eventsRes?.data;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/campaign-events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-events'] });
      toast.success('האירוע נמחק בהצלחה');
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeleteId(null);
    },
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!searchQuery.trim()) return events;
    const q = searchQuery.trim().toLowerCase();
    return events.filter(
      (e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.titleEn && e.titleEn.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

  function handleDelete(id: string) {
    if (deleteId === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteId(id);
      setTimeout(() => setDeleteId(null), 3000);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">אירועי קמפיין</h1>
        <Button onClick={() => router.push('/primaries/events/new')}>
          אירוע חדש +
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי כותרת או עיר..."
          className="pr-10"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תמונה</th>
              <th className="text-right px-4 py-3 font-medium">כותרת</th>
              <th className="text-right px-4 py-3 font-medium">תאריך</th>
              <th className="text-right px-4 py-3 font-medium">מיקום</th>
              <th className="text-right px-4 py-3 font-medium">מועמד</th>
              <th className="text-right px-4 py-3 font-medium">אישורי הגעה</th>
              <th className="text-right px-4 py-3 font-medium">פעיל</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={8} />
              ))
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery.trim()
                    ? 'לא נמצאו אירועים התואמים את החיפוש.'
                    : 'אין אירועים. צור אירוע חדש כדי להתחיל.'}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-10 h-10 rounded object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium max-w-[200px]">
                    <p className="truncate">{event.title}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600" dir="ltr">
                    {event.startDate
                      ? format(new Date(event.startDate), 'dd/MM/yyyy HH:mm')
                      : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {event.city || event.location || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {event.candidate ? event.candidate.fullName : '-'}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {(event.rsvpCount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={event.isActive ? 'success' : 'outline'}>
                      {event.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/primaries/events/${event.id}/edit`)
                        }
                      >
                        עריכה
                      </Button>
                      <Button
                        variant={deleteId === event.id ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteId === event.id ? (
                          'לחץ שוב לאישור'
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
