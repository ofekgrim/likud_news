'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PollingStation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { ElectionSelector } from '@/components/election-selector';
import { CsvImport } from '@/components/csv-import';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function StationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [electionId, setElectionId] = useState<string | undefined>();

  const { data: stationsRes, isLoading } = useQuery({
    queryKey: ['polling-stations', electionId],
    queryFn: () =>
      api.get<{ data: PollingStation[] }>(
        `/polling-stations${electionId ? `?electionId=${electionId}` : ''}`
      ),
    enabled: !!electionId,
  });
  const stations = stationsRes?.data;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/polling-stations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polling-stations'] });
      toast.success('הקלפי נמחקה בהצלחה');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const importMutation = useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const results = await Promise.allSettled(
        rows.map((row) =>
          api.post('/polling-stations', {
            name: row.name,
            address: row.address,
            city: row.city,
            district: row.district || undefined,
            latitude: parseFloat(row.latitude) || 0,
            longitude: parseFloat(row.longitude) || 0,
            capacity: row.capacity ? parseInt(row.capacity) : undefined,
            isAccessible: row.isAccessible === 'true' || row.isAccessible === '1',
            electionId,
            isActive: true,
          })
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      queryClient.invalidateQueries({ queryKey: ['polling-stations'] });
      toast.success(`יובאו ${succeeded} קלפיות בהצלחה${failed > 0 ? ` (${failed} נכשלו)` : ''}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(id: string, name: string) {
    if (window.confirm(`למחוק את הקלפי "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  }

  function handleCsvImport(rows: Record<string, string>[]) {
    if (!electionId) {
      toast.error('יש לבחור בחירות לפני ייבוא');
      return;
    }
    importMutation.mutate(rows);
  }

  const filteredStations = useMemo(() => {
    if (!stations) return [];
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.trim().toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [stations, searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">קלפיות</h1>
        <Button onClick={() => router.push('/primaries/stations/new')}>
          קלפי חדשה +
        </Button>
      </div>

      {/* Election Filter */}
      <div className="mb-4 max-w-sm">
        <ElectionSelector value={electionId} onChange={setElectionId} />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם, עיר או כתובת..."
          className="pr-10"
        />
      </div>

      {!electionId ? (
        <div className="bg-white rounded-lg border shadow-sm p-8 text-center text-gray-400">
          יש לבחור בחירות כדי להציג קלפיות.
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right px-4 py-3 font-medium">שם</th>
                <th className="text-right px-4 py-3 font-medium">כתובת</th>
                <th className="text-right px-4 py-3 font-medium">עיר</th>
                <th className="text-right px-4 py-3 font-medium">מחוז</th>
                <th className="text-right px-4 py-3 font-medium">נגישות</th>
                <th className="text-right px-4 py-3 font-medium">קיבולת</th>
                <th className="text-right px-4 py-3 font-medium">פעיל</th>
                <th className="text-right px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={8} />
                ))
              ) : filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {searchQuery.trim()
                      ? 'לא נמצאו קלפיות התואמות את החיפוש.'
                      : 'אין קלפיות. צור קלפי חדשה כדי להתחיל.'}
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <tr
                    key={station.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium">{station.name}</td>
                    <td className="px-4 py-3.5 text-gray-600">{station.address}</td>
                    <td className="px-4 py-3.5 text-gray-600">{station.city}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {station.district || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      {station.isAccessible ? (
                        <Badge variant="success">&#9855;</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600" dir="ltr">
                      {station.capacity ?? '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={station.isActive ? 'success' : 'outline'}>
                        {station.isActive ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/primaries/stations/${station.id}/edit`
                            )
                          }
                        >
                          עריכה
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDelete(station.id, station.name)}
                          disabled={deleteMutation.isPending}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Import */}
      <div className="mt-6">
        <CsvImport
          onImport={handleCsvImport}
          expectedColumns={[
            'name',
            'address',
            'city',
            'district',
            'latitude',
            'longitude',
            'capacity',
            'isAccessible',
          ]}
          title="ייבוא קלפיות מ-CSV"
        />
      </div>
    </div>
  );
}
