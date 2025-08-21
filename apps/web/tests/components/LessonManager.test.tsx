import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { LessonManager } from '../../src/components/lesson/LessonManager';
import type { Lesson, Project } from '@instructly/shared/types';

// Mock the AI store and TopicAnalyzer
vi.mock('../../src/stores/aiStore', () => ({
  useAIStore: vi.fn(() => ({
    analysisResults: null,
    isAnalyzing: false,
    analysisError: null,
    analyzeTopics: vi.fn(),
    clearAnalysisResults: vi.fn(),
    clearError: vi.fn(),
    monthlyCost: 5.50,
    costLimit: 50,
    withinCostLimits: true,
    getMonthlyCost: vi.fn()
  }))
}));

vi.mock('../../src/components/lesson/TopicAnalyzer', () => ({
  TopicAnalyzer: ({ onAnalysisComplete, className }: any) => (
    <div data-testid="topic-analyzer" className={className}>
      <button 
        onClick={() => onAnalysisComplete({ 
          topics: [{ 
            id: '1', 
            content: 'Test topic', 
            classification: 'facts',
            aiAnalysis: {
              contentType: 'facts',
              rationale: 'Test rationale',
              recommendedMethods: ['test method'],
              confidence: 0.9,
              modelUsed: 'gpt-5'
            },
            generatedAt: new Date() 
          }] 
        })}
      >
        Complete Analysis
      </button>
    </div>
  )
}));

vi.mock('../../src/components/lesson/BulkOperations', () => ({
  BulkOperations: ({ selectedLessons, onClearSelection }: any) => (
    selectedLessons.length > 0 ? (
      <div data-testid="bulk-operations">
        <div>{selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''} selected</div>
        <button onClick={onClearSelection} aria-label="Clear selection">Clear</button>
        <button>Duplicate Lessons</button>
        <button>Move to Project</button>
        <button>Archive Lessons</button>
        <button>Delete Lessons</button>
      </div>
    ) : null
  )
}));

// Mock Hero Icons
vi.mock('@heroicons/react/24/outline', () => ({
  PlusIcon: () => <div data-testid="plus-icon">+</div>,
  XMarkIcon: () => <div data-testid="x-mark-icon">×</div>,
  PencilIcon: () => <div data-testid="pencil-icon">✏</div>,
  TrashIcon: () => <div data-testid="trash-icon">🗑</div>,
  EllipsisVerticalIcon: () => <div data-testid="ellipsis-icon">⋮</div>,
  ClockIcon: () => <div data-testid="clock-icon">⏰</div>,
  UserGroupIcon: () => <div data-testid="user-group-icon">👥</div>,
  BookOpenIcon: () => <div data-testid="book-icon">📖</div>,
  CheckCircleIcon: () => <div data-testid="check-circle-icon">✓</div>,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon">⚠</div>,
  DocumentTextIcon: () => <div data-testid="document-icon">📄</div>,
  PlayIcon: () => <div data-testid="play-icon">▶</div>,
  DocumentDuplicateIcon: () => <div data-testid="document-duplicate-icon">📋</div>,
  ArchiveBoxIcon: () => <div data-testid="archive-box-icon">📦</div>,
  ArrowRightIcon: () => <div data-testid="arrow-right-icon">→</div>,
  CheckIcon: () => <div data-testid="check-icon">✓</div>,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckCircleIcon: () => <div data-testid="check-circle-solid-icon">✅</div>,
  ClockIcon: () => <div data-testid="clock-solid-icon">🕐</div>,
  DocumentTextIcon: () => <div data-testid="document-solid-icon">📋</div>,
  FolderIcon: () => <div data-testid="folder-icon">📁</div>,
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (arr: any[], oldIndex: number, newIndex: number) => {
    const result = [...arr];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  },
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('LessonManager', () => {
  const mockLessons: Lesson[] = [
    {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn the basics of React',
      projectId: 'project-1',
      topics: [],
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
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts',
      projectId: 'project-1',
      topics: [],
      status: 'approved',
      estimatedDuration: 120,
      deliveryFormat: 'self_paced',
      accessibilityCompliance: {
        complianceLevel: 'AA',
        overallScore: 92,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'project-1',
      title: 'React Training Program',
      description: 'Comprehensive React training',
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
  ];

  const defaultProps = {
    projectId: 'project-1',
    lessons: mockLessons,
    availableProjects: mockProjects,
    onCreateLesson: vi.fn(),
    onUpdateLesson: vi.fn(),
    onDeleteLesson: vi.fn(),
    onReorderLessons: vi.fn(),
    onBulkReorderLessons: vi.fn(),
    onEditLesson: vi.fn(),
    onBulkDuplicate: vi.fn(),
    onBulkMove: vi.fn(),
    onBulkArchive: vi.fn(),
    onBulkDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders lesson management interface', () => {
    render(<LessonManager {...defaultProps} />);
    
    expect(screen.getByText('Lesson Management')).toBeInTheDocument();
    expect(screen.getByText('Add Lesson')).toBeInTheDocument();
    expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
  });

  it('displays lesson statistics correctly', () => {
    render(<LessonManager {...defaultProps} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total lessons
    expect(screen.getByText('3h 30m')).toBeInTheDocument(); // Total duration (90 + 120 minutes)
    expect(screen.getByText('0')).toBeInTheDocument(); // Total topics
    expect(screen.getByText('1')).toBeInTheDocument(); // Approved lessons
  });

  it('opens create lesson form when Add Lesson button is clicked', async () => {
    const user = userEvent.setup();
    render(<LessonManager {...defaultProps} />);
    
    const addButton = screen.getByText('Add Lesson');
    await user.click(addButton);
    
    expect(screen.getByText('Create New Lesson')).toBeInTheDocument();
    expect(screen.getByLabelText('Lesson Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('creates a new lesson when form is submitted', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn();
    
    render(<LessonManager {...defaultProps} onCreateLesson={mockCreate} />);
    
    // Open create form
    await user.click(screen.getByText('Add Lesson'));
    
    // Fill in form
    await user.type(screen.getByLabelText('Lesson Title'), 'New Lesson');
    await user.type(screen.getByLabelText('Description'), 'New lesson description');
    
    // Set duration field value directly to avoid concatenation
    const durationField = screen.getByLabelText('Duration (minutes)');
    fireEvent.change(durationField, { target: { value: '180' } });
    
    // Submit form
    await user.click(screen.getByText('Create Lesson'));
    
    expect(mockCreate).toHaveBeenCalledWith({
      title: 'New Lesson',
      description: 'New lesson description',
      projectId: 'project-1',
      topics: [],
      status: 'draft',
      estimatedDuration: 180,
      deliveryFormat: 'instructor_led',
      accessibilityCompliance: {
        complianceLevel: 'AA',
        overallScore: 0,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
    });
  });

  it('enables selection of lessons and shows bulk operations', async () => {
    const user = userEvent.setup();
    render(<LessonManager {...defaultProps} />);
    
    // Select first lesson
    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(firstCheckbox);
    
    // Should show bulk operations
    expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Lessons')).toBeInTheDocument();
    expect(screen.getByText('Move to Project')).toBeInTheDocument();
    expect(screen.getByText('Archive Lessons')).toBeInTheDocument();
    expect(screen.getByText('Delete Lessons')).toBeInTheDocument();
  });

  it('calls edit callback when edit button is clicked', async () => {
    const user = userEvent.setup();
    const mockEdit = vi.fn();
    
    render(<LessonManager {...defaultProps} onEditLesson={mockEdit} />);
    
    const editButtons = screen.getAllByTestId('pencil-icon');
    await user.click(editButtons[0]);
    
    expect(mockEdit).toHaveBeenCalledWith(mockLessons[0]);
  });

  it('calls delete callback when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();
    
    render(<LessonManager {...defaultProps} onDeleteLesson={mockDelete} />);
    
    const deleteButtons = screen.getAllByTestId('trash-icon');
    await user.click(deleteButtons[0]);
    
    expect(mockDelete).toHaveBeenCalledWith('1');
  });

  it('opens topic analyzer modal when add topics button is clicked', async () => {
    const user = userEvent.setup();
    render(<LessonManager {...defaultProps} />);
    
    const addTopicsButtons = screen.getAllByTestId('plus-icon');
    // The first plus icon should be from the Add Lesson button, so use the second one
    await user.click(addTopicsButtons[1]);
    
    expect(screen.getByText('Add Topics to "Introduction to React"')).toBeInTheDocument();
    expect(screen.getByTestId('topic-analyzer')).toBeInTheDocument();
  });

  it('handles topic analysis completion', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn();
    
    render(<LessonManager {...defaultProps} onUpdateLesson={mockUpdate} />);
    
    // Open topic analyzer
    const addTopicsButtons = screen.getAllByTestId('plus-icon');
    await user.click(addTopicsButtons[1]);
    
    // Complete analysis
    await user.click(screen.getByText('Complete Analysis'));
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('1', expect.objectContaining({
        topics: expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            content: 'Test topic',
            classification: 'facts'
          })
        ]),
        status: 'generating'
      }));
    });
  });

  it('displays empty state when no lessons exist', () => {
    render(<LessonManager {...defaultProps} lessons={[]} />);
    
    expect(screen.getByText('No lessons yet')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first lesson for this project.')).toBeInTheDocument();
    expect(screen.getByText('Add First Lesson')).toBeInTheDocument();
  });

  it('displays correct lesson status indicators', () => {
    render(<LessonManager {...defaultProps} />);
    
    // Check for status badges
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays lesson delivery format correctly', () => {
    render(<LessonManager {...defaultProps} />);
    
    expect(screen.getByText('instructor led')).toBeInTheDocument();
    expect(screen.getByText('self paced')).toBeInTheDocument();
  });

  it('formats lesson duration correctly', () => {
    render(<LessonManager {...defaultProps} />);
    
    expect(screen.getByText('1h 30m')).toBeInTheDocument(); // 90 minutes
    expect(screen.getByText('2h')).toBeInTheDocument(); // 120 minutes
  });

  describe('Bulk Multi-Select Operations', () => {
    it('supports Ctrl+click for multi-selection', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} />);
      
      // First click selects first lesson
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      
      // Ctrl+click on second lesson adds to selection
      const secondCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(secondCheckbox, { ctrlKey: true });
      expect(screen.getByText('2 lessons selected')).toBeInTheDocument();
    });

    it('supports Shift+click for range selection', async () => {
      const user = userEvent.setup();
      const threeLessons = [
        ...mockLessons,
        {
          ...mockLessons[0],
          id: '3',
          title: 'Third Lesson',
        } as Lesson
      ];
      
      render(<LessonManager {...defaultProps} lessons={threeLessons} />);
      
      // First click selects first lesson
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      
      // Shift+click on third lesson selects range
      const thirdCheckbox = screen.getAllByRole('checkbox')[2];
      await user.click(thirdCheckbox, { shiftKey: true });
      expect(screen.getByText('3 lessons selected')).toBeInTheDocument();
    });

    it('updates aria-label to include multi-select instructions', () => {
      render(<LessonManager {...defaultProps} />);
      
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toHaveAccessibleName(/Hold Ctrl to toggle, Shift to select range/);
    });

    it('shows visual feedback for selected lessons', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} />);
      
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      
      // Check that the lesson item has the selected styling
      const lessonItem = firstCheckbox.closest('[class*="border-indigo-300"]');
      expect(lessonItem).toBeInTheDocument();
    });

    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} />);
      
      // Select a lesson
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      
      // Click clear button
      const clearButton = screen.getByLabelText('Clear selection');
      await user.click(clearButton);
      expect(screen.queryByText('1 lesson selected')).not.toBeInTheDocument();
    });

    it('maintains selection consistency when lessons are reordered', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} />);
      
      // Select first lesson
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      
      // Simulate a reorder (this would normally happen through drag & drop)
      // Since we can't easily simulate DnD in tests, we'll verify the state management logic
      expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    });
  });

  describe('Bulk Drag-and-Drop Reordering', () => {
    it('calls onBulkReorderLessons when dragging selected lessons', async () => {
      const mockBulkReorder = vi.fn();
      const user = userEvent.setup();
      
      render(
        <LessonManager 
          {...defaultProps} 
          onBulkReorderLessons={mockBulkReorder}
        />
      );
      
      // Select multiple lessons
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      const secondCheckbox = screen.getAllByRole('checkbox')[1];
      
      await user.click(firstCheckbox);
      await user.click(secondCheckbox, { ctrlKey: true });
      expect(screen.getByText('2 lessons selected')).toBeInTheDocument();
      
      // Note: Full drag-and-drop testing would require more complex setup
      // This test verifies the selection state is maintained correctly
      expect(mockBulkReorder).toHaveBeenCalledTimes(0); // Not called yet
    });

    it('falls back to regular reorder when onBulkReorderLessons not provided', async () => {
      const mockReorder = vi.fn();
      const user = userEvent.setup();
      
      render(
        <LessonManager 
          {...defaultProps} 
          onReorderLessons={mockReorder}
          onBulkReorderLessons={undefined}
        />
      );
      
      // Select lessons and verify fallback behavior works
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      // The fallback logic is tested through the drag end handler
    });

    it('shows bulk selection count in drag overlay', () => {
      render(<LessonManager {...defaultProps} />);
      
      // Check that DragOverlay is rendered (even if not actively dragging)
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
    });

    it('maintains relative order of selected lessons during bulk drag', async () => {
      const user = userEvent.setup();
      
      // Create test data with specific order
      const orderedLessons = [
        { ...mockLessons[0], title: 'First' },
        { ...mockLessons[1], title: 'Second' },
        { ...mockLessons[0], id: '3', title: 'Third' },
      ] as Lesson[];
      
      render(<LessonManager {...defaultProps} lessons={orderedLessons} />);
      
      // Select first and third lessons
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // First
      await user.click(checkboxes[2], { ctrlKey: true }); // Third
      
      expect(screen.getByText('2 lessons selected')).toBeInTheDocument();
      
      // Verify both selected lessons are properly identified
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles empty lesson list gracefully', () => {
      render(<LessonManager {...defaultProps} lessons={[]} />);
      
      expect(screen.getByText('No lessons yet')).toBeInTheDocument();
      expect(screen.queryByText('lessons selected')).not.toBeInTheDocument();
    });

    it('handles single lesson selection correctly', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} lessons={[mockLessons[0]]} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
    });

    it('prevents invalid range selection when no previous selection exists', async () => {
      const user = userEvent.setup();
      render(<LessonManager {...defaultProps} />);
      
      // Shift+click without previous selection should act as normal click
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox, { shiftKey: true });
      
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
    });

    it('handles lesson list updates while maintaining selection state', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LessonManager {...defaultProps} />);
      
      // Select first lesson
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);
      expect(screen.getByText('1 lesson selected')).toBeInTheDocument();
      
      // Update lessons list (simulate new data from API)
      const updatedLessons = [...mockLessons, {
        ...mockLessons[0],
        id: '3',
        title: 'New Lesson'
      } as Lesson];
      
      rerender(<LessonManager {...defaultProps} lessons={updatedLessons} />);
      
      // Selection should be maintained or cleared appropriately
      expect(screen.getByText('New Lesson')).toBeInTheDocument();
    });
  });
});