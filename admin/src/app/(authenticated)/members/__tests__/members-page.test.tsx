import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import MembersPage from '../page';

const mockPush = vi.fn();

vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({
      push: mockPush,
      back: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/members',
    useSearchParams: () => new URLSearchParams(),
  };
});

describe('MembersPage', () => {
  it('renders page title', () => {
    render(<MembersPage />);
    expect(screen.getByText('חברי כנסת')).toBeInTheDocument();
  });

  it('renders add member button', () => {
    render(<MembersPage />);
    expect(screen.getByText('חבר חדש +')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<MembersPage />);
    expect(screen.getByPlaceholderText('חיפוש לפי שם או תפקיד...')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<MembersPage />);
    expect(screen.getByText('שם')).toBeInTheDocument();
    expect(screen.getByText('תפקיד')).toBeInTheDocument();
    expect(screen.getByText('משרד')).toBeInTheDocument();
    expect(screen.getByText('אימייל')).toBeInTheDocument();
    expect(screen.getByText('סטטוס')).toBeInTheDocument();
    expect(screen.getByText('פעולות')).toBeInTheDocument();
    expect(screen.getByText('תמונה')).toBeInTheDocument();
  });

  it('renders member names after loading', async () => {
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText('יוסי כהן')).toBeInTheDocument();
    });
    expect(screen.getByText('שרה לוי')).toBeInTheDocument();
  });

  it('renders active badge for active members', async () => {
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText('פעיל')).toBeInTheDocument();
    });
  });

  it('renders inactive badge for inactive members', async () => {
    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText('לא פעיל')).toBeInTheDocument();
    });
  });

  it('renders edit button for each member', async () => {
    render(<MembersPage />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('עריכה');
      expect(editButtons).toHaveLength(2);
    });
  });
});
