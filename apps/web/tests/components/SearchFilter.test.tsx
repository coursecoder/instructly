import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchFilter } from '../../src/components/search/SearchFilter';
import type { Project, Lesson } from '@instructly/shared/types';

// Mock Hero Icons
vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <div data-testid="magnifying-glass-icon">🔍</div>,
  FunnelIcon: () => <div data-testid="funnel-icon">⚗️</div>,
  XMarkIcon: () => <div data-testid="x-mark-icon">×</div>,
  AdjustmentsHorizontalIcon: () => <div data-testid="adjustments-icon">⚙️</div>,
}));

describe('SearchFilter', () => {
  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'React Training Program',
      description: 'Comprehensive React development course',
      targetAudience: 'Developers',
      estimatedDuration: 480,
      status: 'in_progress',
      ownerId: 'user-1',
      collaborators: [],
      settings: {
        brandingOptions: { organizationName: 'Test Org' },
        defaultAccessibilityLevel: 'AA',
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Vue.js Basics',
      description: 'Introduction to Vue framework',
      targetAudience: 'Frontend Developers',
      estimatedDuration: 240,
      status: 'completed',
      ownerId: 'user-1',
      collaborators: [],
      settings: {
        brandingOptions: { organizationName: 'Test Org' },
        defaultAccessibilityLevel: 'AA',
        approvalWorkflow: false,
        stakeholderAccess: false,
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockLessons: Lesson[] = [
    {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn React fundamentals',
      projectId: '1',
      topics: [
        {
          id: '1',
          content: 'React components',
          classification: 'concepts',
          aiAnalysis: {
            contentType: 'concepts',
            rationale: 'Test rationale',
            recommendedMethods: ['demonstration'],
            confidence: 0.9,
            modelUsed: 'gpt-5'
          },
          generatedAt: new Date()
        }
      ],
      status: 'draft',
      estimatedDuration: 90,
      deliveryFormat: 'instructor_led',
      accessibilityCompliance: {
        complianceLevel: 'AA',
        overallScore: 85,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Vue Components',
      description: 'Understanding Vue component system',
      projectId: '2',
      topics: [
        {
          id: '2',
          content: 'Vue templates',
          classification: 'procedures',
          aiAnalysis: {
            contentType: 'procedures',
            rationale: 'Test rationale',
            recommendedMethods: ['practice'],
            confidence: 0.8,
            modelUsed: 'gpt-5'
          },
          generatedAt: new Date()
        }
      ],
      status: 'approved',
      estimatedDuration: 120,
      deliveryFormat: 'self_paced',
      accessibilityCompliance: {
        complianceLevel: 'AAA',
        overallScore: 95,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockOnFilteredResults = vi.fn();

  const defaultProps = {
    projects: mockProjects,
    lessons: mockLessons,
    onFilteredResults: mockOnFilteredResults,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search interface', () => {
    render(<SearchFilter {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search projects and lessons...')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 projects and 2 lessons')).toBeInTheDocument();
  });

  it('filters projects and lessons by search query', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects and lessons...');
    await user.type(searchInput, 'React');
    
    // Wait for debounced search (300ms)
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        [mockProjects[0]], // Only React project
        [mockLessons[0]]    // Only React lesson
      );
    }, { timeout: 500 });
  });

  it('clears search when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects and lessons...');
    await user.type(searchInput, 'React');
    
    const clearButton = screen.getByTestId('x-mark-icon');
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('shows and hides filter panel', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    const filtersButton = screen.getByText('Filters');
    
    // Filter panel should not be visible initially
    expect(screen.queryByText('Project Status')).not.toBeInTheDocument();
    
    // Click to show filters
    await user.click(filtersButton);
    expect(screen.getByText('Project Status')).toBeInTheDocument();
    expect(screen.getByText('Lesson Status')).toBeInTheDocument();
    expect(screen.getByText('Delivery Format')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    
    // Click to hide filters
    await user.click(filtersButton);
    expect(screen.queryByText('Project Status')).not.toBeInTheDocument();
  });

  it('filters by project status', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select "completed" status
    const completedCheckbox = screen.getByRole('checkbox', { name: /completed/i });
    await user.click(completedCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        [mockProjects[1]], // Only completed project
        mockLessons         // All lessons (no lesson status filter applied)
      );
    });
  });

  it('filters by lesson status', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select "approved" status
    const approvedCheckbox = screen.getByRole('checkbox', { name: /approved/i });
    await user.click(approvedCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        mockProjects,        // All projects (no project status filter applied)
        [mockLessons[1]]     // Only approved lesson
      );
    });
  });

  it('filters by delivery format', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select "Self Paced" format
    const selfPacedCheckbox = screen.getByRole('checkbox', { name: /self paced/i });
    await user.click(selfPacedCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        mockProjects,        // All projects
        [mockLessons[1]]     // Only self-paced lesson
      );
    });
  });

  it('filters by accessibility compliance level', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select "WCAG AAA" level
    const aaaCheckbox = screen.getByRole('checkbox', { name: /wcag aaa/i });
    await user.click(aaaCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        mockProjects,        // All projects
        [mockLessons[1]]     // Only AAA-compliant lesson
      );
    });
  });

  it('combines multiple filters', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select both "approved" lesson status and "Self Paced" format
    const approvedCheckbox = screen.getByRole('checkbox', { name: /approved/i });
    const selfPacedCheckbox = screen.getByRole('checkbox', { name: /self paced/i });
    
    await user.click(approvedCheckbox);
    await user.click(selfPacedCheckbox);
    
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        mockProjects,        // All projects
        [mockLessons[1]]     // Only lesson that is both approved AND self-paced
      );
    });
  });

  it('shows active filter count', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Select two filters
    const approvedCheckbox = screen.getByRole('checkbox', { name: /approved/i });
    const selfPacedCheckbox = screen.getByRole('checkbox', { name: /self paced/i });
    
    await user.click(approvedCheckbox);
    await user.click(selfPacedCheckbox);
    
    // Should show filter count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Add some filters first
    await user.type(screen.getByPlaceholderText('Search projects and lessons...'), 'React');
    await user.click(screen.getByText('Filters'));
    
    const approvedCheckbox = screen.getByRole('checkbox', { name: /approved/i });
    await user.click(approvedCheckbox);
    
    // Should show clear all button
    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });
    
    // Click clear all
    await user.click(screen.getByText('Clear all'));
    
    // Search input should be cleared and filter should be unchecked
    expect(screen.getByPlaceholderText('Search projects and lessons...')).toHaveValue('');
    expect(approvedCheckbox).not.toBeChecked();
    
    // Should call with all results
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(mockProjects, mockLessons);
    });
  });

  it('searches within topic content and classifications', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search projects and lessons...');
    await user.type(searchInput, 'components');
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockOnFilteredResults).toHaveBeenCalledWith(
        [], // No projects match "components"
        [mockLessons[0]] // Lesson with "React components" topic
      );
    }, { timeout: 500 });
  });

  it('updates results summary correctly', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...defaultProps} />);
    
    // Filter to show only one project
    const searchInput = screen.getByPlaceholderText('Search projects and lessons...');
    await user.type(searchInput, 'React');
    
    await waitFor(() => {
      expect(screen.getByText('Results for "React"')).toBeInTheDocument();
    }, { timeout: 500 });
  });
});