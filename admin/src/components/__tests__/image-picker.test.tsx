import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '../../__tests__/test-utils';
import { ImagePicker } from '../image-picker';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
  uploadFile: vi.fn(),
}));

// Mock the Dialog to avoid portal/radix issues
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    <h2>{children}</h2>,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('ImagePicker', () => {
  it('renders label "תמונה" by default', () => {
    render(<ImagePicker onChange={vi.fn()} />);

    expect(screen.getByText('תמונה')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<ImagePicker onChange={vi.fn()} label="תמונה ראשית" />);

    expect(screen.getByText('תמונה ראשית')).toBeInTheDocument();
    expect(screen.queryByText('תמונה')).not.toBeInTheDocument();
  });

  it('shows upload area "בחר תמונה" when no value', () => {
    render(<ImagePicker onChange={vi.fn()} />);

    expect(screen.getByText('בחר תמונה')).toBeInTheDocument();
  });

  it('shows "בחר מספריית מדיה" button when no value', () => {
    render(<ImagePicker onChange={vi.fn()} />);

    expect(screen.getByText('בחר מספריית מדיה')).toBeInTheDocument();
  });

  it('shows image preview when value is provided', () => {
    render(
      <ImagePicker onChange={vi.fn()} value="https://example.com/image.jpg" />
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');

    // Upload area should not be visible
    expect(screen.queryByText('בחר תמונה')).not.toBeInTheDocument();
    expect(screen.queryByText('בחר מספריית מדיה')).not.toBeInTheDocument();
  });

  it('calls onChange with empty string when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ImagePicker onChange={onChange} value="https://example.com/image.jpg" />
    );

    // The remove button contains the X icon; it is the button within the preview area
    const removeButton = screen.getByRole('button');
    await user.click(removeButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('has hidden file input with accept="image/*"', () => {
    const { container } = render(<ImagePicker onChange={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveClass('hidden');
  });
});
