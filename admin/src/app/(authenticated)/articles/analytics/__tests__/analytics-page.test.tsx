import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '../../../../../__tests__/test-utils';
import ArticleAnalyticsPage from '../page';

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

describe('ArticleAnalyticsPage', () => {
  it('renders page title "אנליטיקס כתבות"', () => {
    render(<ArticleAnalyticsPage />);
    expect(screen.getByRole('heading', { name: 'אנליטיקס כתבות' })).toBeInTheDocument();
  });

  it('renders period toggle buttons (היום, השבוע, החודש)', () => {
    render(<ArticleAnalyticsPage />);
    expect(screen.getByRole('button', { name: 'היום' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'השבוע' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'החודש' })).toBeInTheDocument();
  });

  it('renders stat card labels (צפיות, שיתופים, קריאה מלאה, תגובות)', () => {
    render(<ArticleAnalyticsPage />);
    // "צפיות" appears in stat card, top articles toggle, and table header — use getAllByText
    expect(screen.getAllByText('צפיות').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('שיתופים').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('קריאה מלאה').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('תגובות')).toBeInTheDocument();
  });

  it('renders stat values after loading', async () => {
    render(<ArticleAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('1,500') || content.includes('1500'))).toBeInTheDocument();
    });
  });

  it('renders trend chart section title "מגמת צפיות (30 ימים)"', () => {
    render(<ArticleAnalyticsPage />);
    expect(screen.getByText('מגמת צפיות (30 ימים)', { exact: false })).toBeInTheDocument();
  });

  it('renders referrer chart section title "מקורות הפניה"', () => {
    render(<ArticleAnalyticsPage />);
    expect(screen.getByText('מקורות הפניה')).toBeInTheDocument();
  });

  it('renders top articles section title "כתבות מובילות"', () => {
    render(<ArticleAnalyticsPage />);
    expect(screen.getByText('כתבות מובילות')).toBeInTheDocument();
  });

  it('renders top event type toggle buttons (צפיות, שיתופים, קריאה מלאה)', () => {
    render(<ArticleAnalyticsPage />);

    const viewButtons = screen.getAllByRole('button', { name: 'צפיות' });
    const shareButtons = screen.getAllByRole('button', { name: 'שיתופים' });
    const readButtons = screen.getAllByRole('button', { name: 'קריאה מלאה' });

    // There should be at least 2 of each: one in stat cards area labels, one in top articles toggle
    // But the stat card labels are <p> not buttons, so the toggle buttons should be found
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
    expect(shareButtons.length).toBeGreaterThanOrEqual(1);
    expect(readButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders top article title after loading', async () => {
    render(<ArticleAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Top Article')).toBeInTheDocument();
    });
  });
});
