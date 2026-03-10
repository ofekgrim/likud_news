import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

// Get mock router from setup
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
    usePathname: () => '/login',
    useSearchParams: () => new URLSearchParams(),
  };
});

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('מצודת הליכוד')).toBeInTheDocument();
    expect(screen.getByText('כניסה למערכת הניהול')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/דוא/)).toBeInTheDocument();
  });

  it('renders password input field', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'כניסה' })).toBeInTheDocument();
  });

  it('renders logo icon', () => {
    render(<LoginPage />);
    // The logo is a div with "מ" text
    expect(screen.getByText('מ')).toBeInTheDocument();
  });

  it('updates email field on input', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByLabelText(/דוא/) as HTMLInputElement;

    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  it('updates password field on input', async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText('סיסמה') as HTMLInputElement;

    await userEvent.type(passwordInput, 'password123');
    expect(passwordInput.value).toBe('password123');
  });

  it('submits login form with correct credentials', async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/דוא/), 'admin@likud.org.il');
    await userEvent.type(screen.getByLabelText('סיסמה'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'כניסה' }));

    // Wait for the async login to complete
    await vi.waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });
  });
});
