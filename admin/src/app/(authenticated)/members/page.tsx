'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function MembersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get<Member[]>('/members'),
  });

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!searchQuery.trim()) return members;
    const q = searchQuery.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.titleEn && m.titleEn.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  function getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">חברי כנסת</h1>
        <Button onClick={() => router.push('/members/new')}>חבר חדש +</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם או תפקיד..."
          className="pr-10"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-right px-4 py-3 font-medium w-16">תמונה</th>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">תפקיד</th>
              <th className="text-right px-4 py-3 font-medium">משרד</th>
              <th className="text-right px-4 py-3 font-medium">אימייל</th>
              <th className="text-right px-4 py-3 font-medium">סטטוס</th>
              <th className="text-right px-4 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery.trim()
                    ? 'לא נמצאו חברים התואמים את החיפוש.'
                    : 'אין חברים. צור חבר חדש כדי להתחיל.'}
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0099DB] flex items-center justify-center text-white font-semibold text-sm">
                        {getInitial(member.name)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{member.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{member.title || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-600">{member.office || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs" dir="ltr">
                    {member.email || '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={member.isActive ? 'success' : 'outline'}>
                      {member.isActive ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/members/${member.id}/edit`)}
                    >
                      עריכה
                    </Button>
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
