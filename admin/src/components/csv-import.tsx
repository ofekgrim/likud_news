'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Upload, X, Check } from 'lucide-react';

interface CsvImportProps {
  onImport: (rows: Record<string, string>[]) => void;
  expectedColumns: string[];
  title?: string;
}

export function CsvImport({ onImport, expectedColumns, title = 'ייבוא CSV' }: CsvImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setError('הקובץ חייב לכלול כותרת ולפחות שורה אחת של נתונים');
        return;
      }

      const csvHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const missing = expectedColumns.filter((c) => !csvHeaders.includes(c));
      if (missing.length > 0) {
        setError(`עמודות חסרות: ${missing.join(', ')}`);
        return;
      }

      const parsed = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        csvHeaders.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });

      setHeaders(csvHeaders);
      setRows(parsed);
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    onImport(rows);
    setRows([]);
    setHeaders([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleCancel() {
    setRows([]);
    setHeaders([]);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" />
            בחר קובץ CSV
          </Button>
          <p className="text-xs text-gray-400">
            עמודות נדרשות: {expectedColumns.join(', ')}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {rows.length > 0 && (
          <>
            <div className="border rounded-lg overflow-auto max-h-60">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="text-right px-2 py-1.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1.5 text-gray-600">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              מציג {Math.min(10, rows.length)} מתוך {rows.length} שורות
            </p>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleConfirm}>
                <Check className="h-4 w-4 ml-1" />
                ייבא {rows.length} שורות
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 ml-1" />
                ביטול
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
