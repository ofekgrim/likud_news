import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '../../../../__tests__/test-utils';
import CategoriesPage from '../page';

describe('CategoriesPage', () => {
  it('renders page title "קטגוריות"', async () => {
    render(<CategoriesPage />);

    expect(screen.getByText('קטגוריות')).toBeInTheDocument();
  });

  it('renders add category button "קטגוריה חדשה +"', () => {
    render(<CategoriesPage />);

    expect(screen.getByText('קטגוריה חדשה +')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<CategoriesPage />);

    expect(screen.getByText('שם')).toBeInTheDocument();
    expect(screen.getByText('Slug')).toBeInTheDocument();
    expect(screen.getByText('סדר')).toBeInTheDocument();
    expect(screen.getByText('פעולות')).toBeInTheDocument();
  });

  it('renders category names after loading', async () => {
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });
    expect(screen.getByText('כלכלה')).toBeInTheDocument();
  });

  it('renders category slugs after loading', async () => {
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('politics')).toBeInTheDocument();
    });
    expect(screen.getByText('economy')).toBeInTheDocument();
  });

  it('renders edit buttons for each category', async () => {
    render(<CategoriesPage />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('עריכה');
      expect(editButtons).toHaveLength(2);
    });
  });

  it('renders delete buttons for each category', async () => {
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });

    // Trash2 icons render as SVG elements; each delete button contains one
    const deleteButtons = document.querySelectorAll('svg.lucide-trash2, svg.lucide-trash-2');
    expect(deleteButtons.length).toBe(2);
  });
});
