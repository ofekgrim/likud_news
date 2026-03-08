import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../../__tests__/test-utils';
import AuthenticatedLayout from '../layout';

const mockReplace = vi.fn();

vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      back: vi.fn(),
      replace: mockReplace,
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/dashboard',
    useSearchParams: () => new URLSearchParams(),
  };
});

// Mock Header and Sidebar to simplify
vi.mock('@/components/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

describe('AuthenticatedLayout', () => {
  it('redirects to /login when no token', async () => {
    localStorage.removeItem('token');

    render(
      <AuthenticatedLayout>
        <div>Protected Content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders children when token exists', async () => {
    localStorage.setItem('token', 'valid-token');

    render(
      <AuthenticatedLayout>
        <div>Protected Content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('renders sidebar when authenticated', async () => {
    localStorage.setItem('token', 'valid-token');

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  it('renders header when authenticated', async () => {
    localStorage.setItem('token', 'valid-token');

    render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  it('shows loading spinner before auth check completes', () => {
    localStorage.removeItem('token');

    const { container } = render(
      <AuthenticatedLayout>
        <div>Content</div>
      </AuthenticatedLayout>,
    );

    // The spinner SVG should be present initially
    const spinner = container.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
