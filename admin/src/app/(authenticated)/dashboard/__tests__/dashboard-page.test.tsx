import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import DashboardPage from '../page';

describe('DashboardPage', () => {
  it('renders stat card labels', () => {
    render(<DashboardPage />);

    expect(screen.getByText('כתבות')).toBeInTheDocument();
    expect(screen.getByText('קטגוריות')).toBeInTheDocument();
    expect(screen.getByText('פריטי טיקר')).toBeInTheDocument();
    expect(screen.getByText('חברי כנסת')).toBeInTheDocument();
    expect(screen.getByText('הודעות שלא נקראו')).toBeInTheDocument();
  });

  it('renders quick actions section title', () => {
    render(<DashboardPage />);

    expect(screen.getByText('פעולות מהירות')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<DashboardPage />);

    expect(screen.getByText('כתבה חדשה')).toBeInTheDocument();
    expect(screen.getByText('פריט טיקר')).toBeInTheDocument();
    expect(screen.getByText('שליחת התראה')).toBeInTheDocument();
  });

  it('renders recent articles section title', () => {
    render(<DashboardPage />);

    expect(screen.getByText('כתבות אחרונות')).toBeInTheDocument();
  });

  it('renders "הצג הכל" link', () => {
    render(<DashboardPage />);

    const link = screen.getByText('הצג הכל');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/articles');
  });

  it('renders recent article titles after loading', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Article 2')).toBeInTheDocument();
  });

  it('renders stat values after loading', async () => {
    render(<DashboardPage />);

    // articles total = 2, categories = 2, members = 2 → three "2" values
    await waitFor(() => {
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(3);
    });

    // ticker = 1, unread contact = 3
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
