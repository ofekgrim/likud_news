import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import { Sidebar } from '../sidebar';

describe('Sidebar', () => {
  it('renders app name', () => {
    render(<Sidebar />);
    expect(screen.getByText('מצודת הליכוד')).toBeInTheDocument();
  });

  it('renders content management label', () => {
    render(<Sidebar />);
    expect(screen.getByText('תוכן')).toBeInTheDocument();
  });

  it('renders management label', () => {
    render(<Sidebar />);
    expect(screen.getByText('ניהול')).toBeInTheDocument();
  });

  it('renders elections label', () => {
    render(<Sidebar />);
    const matches = screen.getAllByText('בחירות');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders dashboard link', () => {
    render(<Sidebar />);
    const dashboardLinks = screen.getAllByText('לוח בקרה');
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    expect(dashboardLinks[0].closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('renders articles link', () => {
    render(<Sidebar />);
    expect(screen.getByText('כתבות')).toBeInTheDocument();
    expect(screen.getByText('כתבות').closest('a')).toHaveAttribute('href', '/articles');
  });

  it('renders categories link', () => {
    render(<Sidebar />);
    expect(screen.getByText('קטגוריות')).toBeInTheDocument();
    expect(screen.getByText('קטגוריות').closest('a')).toHaveAttribute('href', '/categories');
  });

  it('renders members link', () => {
    render(<Sidebar />);
    expect(screen.getByText('חברי כנסת')).toBeInTheDocument();
    expect(screen.getByText('חברי כנסת').closest('a')).toHaveAttribute('href', '/members');
  });

  it('renders ticker link', () => {
    render(<Sidebar />);
    expect(screen.getByText('טיקר')).toBeInTheDocument();
  });

  it('renders version info', () => {
    render(<Sidebar />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });
});
