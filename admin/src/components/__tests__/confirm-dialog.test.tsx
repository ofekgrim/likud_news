import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ui/confirm-dialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
  };

  it('renders title when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('renders description when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default confirm label in Hebrew', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('אישור')).toBeInTheDocument();
  });

  it('renders cancel button in Hebrew', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('ביטול')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="מחק" />);
    expect(screen.getByText('מחק')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByText('אישור'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await userEvent.click(screen.getByText('ביטול'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('shows loading text when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
