import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import ArticlesPage from '../page';

describe('ArticlesPage', () => {
  it('renders page title "כתבות"', () => {
    render(<ArticlesPage />);
    expect(screen.getByRole('heading', { name: 'כתבות' })).toBeInTheDocument();
  });

  it('renders new article button "כתבה חדשה"', () => {
    render(<ArticlesPage />);
    expect(screen.getByRole('button', { name: /כתבה חדשה/ })).toBeInTheDocument();
  });

  it('renders analytics button "אנליטיקס"', () => {
    render(<ArticlesPage />);
    expect(screen.getByRole('button', { name: /אנליטיקס/ })).toBeInTheDocument();
  });

  it('renders search input with placeholder "חיפוש כתבות..."', () => {
    render(<ArticlesPage />);
    expect(screen.getByPlaceholderText('חיפוש כתבות...')).toBeInTheDocument();
  });

  it('renders article titles after loading', async () => {
    render(<ArticlesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Article 1')).toBeInTheDocument();
      expect(screen.getByText('Test Article 2')).toBeInTheDocument();
    });
  });

  it('renders status badges (פורסם for published, טיוטה for draft)', async () => {
    render(<ArticlesPage />);

    await waitFor(() => {
      expect(screen.getByText('פורסם')).toBeInTheDocument();
      expect(screen.getByText('טיוטה')).toBeInTheDocument();
    });
  });

  it('renders "ראשי" badge for hero articles', async () => {
    render(<ArticlesPage />);

    await waitFor(() => {
      // Article 2 has isHero: true
      expect(screen.getByText('ראשי')).toBeInTheDocument();
    });
  });

  it('shows "מרכזית" badge for isMain articles', async () => {
    render(<ArticlesPage />);

    await waitFor(() => {
      // Article 1 has isMain: true
      expect(screen.getByText('מרכזית')).toBeInTheDocument();
    });
  });

  it('renders engagement filter dropdown with "כל הכתבות" option', () => {
    render(<ArticlesPage />);

    const option = screen.getByRole('option', { name: 'כל הכתבות' });
    expect(option).toBeInTheDocument();

    // Verify the select contains engagement filter options
    expect(screen.getByRole('option', { name: 'תגובות רבות (10+)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'צפיות רבות (1000+)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'טרנדינג' })).toBeInTheDocument();
  });
});
