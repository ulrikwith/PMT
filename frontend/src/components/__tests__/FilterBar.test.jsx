import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from '../FilterBar';

describe('FilterBar Component', () => {
  const mockOnFilterChange = vi.fn();
  const defaultFilters = {
    dimension: '',
    status: '',
    energy: '',
    search: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render search input', () => {
    render(<FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should display initial search value from filters', () => {
    const filters = { ...defaultFilters, search: 'test query' };
    render(<FilterBar filters={filters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toHaveValue('test query');
  });

  it('should debounce search input (300ms)', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);

    // Type quickly
    await user.type(searchInput, 'test');

    // Should not call onFilterChange immediately
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          ...defaultFilters,
          search: 'test',
        });
      },
      { timeout: 500 }
    );

    // Should only be called once
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
  });

  it('should update search input value immediately (controlled component)', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);

    await user.type(searchInput, 'immediate');

    // Input should show value immediately (controlled by local state)
    expect(searchInput).toHaveValue('immediate');

    // But callback should not be called yet (within debounce window)
    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });

  it('should sync with external filter changes', () => {
    const { rerender } = render(
      <FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />
    );

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toHaveValue('');

    // External filter change (e.g., from URL)
    const newFilters = { ...defaultFilters, search: 'external change' };
    rerender(<FilterBar filters={newFilters} onFilterChange={mockOnFilterChange} />);

    expect(searchInput).toHaveValue('external change');
  });

  it('should have proper accessibility attributes', () => {
    render(<FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);

    // Should have aria-label
    expect(searchInput).toHaveAttribute('aria-label');
  });

  it('should clear search input when value is empty', async () => {
    const user = userEvent.setup();
    const filters = { ...defaultFilters, search: 'test' };
    render(<FilterBar filters={filters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toHaveValue('test');

    // Clear the input
    await user.clear(searchInput);

    // Input should be empty
    expect(searchInput).toHaveValue('');

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          ...defaultFilters,
          search: '',
        });
      },
      { timeout: 500 }
    );
  });

  it('should handle rapid typing (debounce cancellation)', async () => {
    const user = userEvent.setup();
    render(<FilterBar filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search tasks/i);

    // Type rapidly
    await user.type(searchInput, 'a');
    await new Promise((resolve) => setTimeout(resolve, 100)); // Less than debounce
    await user.type(searchInput, 'b');
    await new Promise((resolve) => setTimeout(resolve, 100)); // Less than debounce
    await user.type(searchInput, 'c');

    // Should not have called yet
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Wait for final debounce
    await waitFor(
      () => {
        expect(mockOnFilterChange).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    // Should only call once with final value
    expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'abc',
    });
  });
});
