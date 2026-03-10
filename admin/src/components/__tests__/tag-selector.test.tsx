import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { TagSelector } from '../tag-selector';

describe('TagSelector', () => {
  const defaultProps = {
    selectedIds: [] as string[],
    onChange: vi.fn(),
  };

  it('renders label "תגיות"', () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText('תגיות')).toBeInTheDocument();
  });

  it('renders dropdown trigger "הוסף תגית..."', () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText('הוסף תגית...')).toBeInTheDocument();
  });

  it('shows tag list when dropdown is opened', async () => {
    render(<TagSelector {...defaultProps} />);

    await userEvent.click(screen.getByText('הוסף תגית...'));

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });
    expect(screen.getByText('ירושלים')).toBeInTheDocument();
  });

  it('shows selected tags as chips', async () => {
    render(<TagSelector {...defaultProps} selectedIds={['1']} />);

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });
  });

  it('calls onChange when removing a tag chip', async () => {
    const onChange = vi.fn();
    render(<TagSelector selectedIds={['1']} onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });

    // Click the X button inside the chip to remove the tag
    const removeButton = screen.getByText('פוליטיקה').closest('span')!.querySelector('button')!;
    await userEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('calls onChange when selecting a tag from dropdown', async () => {
    const onChange = vi.fn();
    render(<TagSelector selectedIds={[]} onChange={onChange} />);

    await userEvent.click(screen.getByText('הוסף תגית...'));

    await waitFor(() => {
      expect(screen.getByText('פוליטיקה')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('פוליטיקה'));

    expect(onChange).toHaveBeenCalledWith(['1']);
  });

  it('shows "צור תגית חדשה" button in dropdown', async () => {
    render(<TagSelector {...defaultProps} />);

    await userEvent.click(screen.getByText('הוסף תגית...'));

    await waitFor(() => {
      expect(screen.getByText('צור תגית חדשה')).toBeInTheDocument();
    });
  });

  it('shows create form when "צור תגית חדשה" is clicked', async () => {
    render(<TagSelector {...defaultProps} />);

    await userEvent.click(screen.getByText('הוסף תגית...'));

    await waitFor(() => {
      expect(screen.getByText('צור תגית חדשה')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('צור תגית חדשה'));

    expect(screen.getByPlaceholderText('שם התגית (עברית)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Slug (אוטומטי אם ריק)')).toBeInTheDocument();
    expect(screen.getByText('צור')).toBeInTheDocument();
    expect(screen.getByText('ביטול')).toBeInTheDocument();
  });
});
