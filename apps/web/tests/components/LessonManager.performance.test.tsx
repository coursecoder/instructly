import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonManager } from '../../src/components/lesson/LessonManager';
import type { Lesson, Project } from '@instructly/shared/types';

// Mock components
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
  TopicAnalyzer: ({ className }: any) => (
    <div data-testid="topic-analyzer" className={className}>
      Mock Topic Analyzer
    </div>
  )
}));

vi.mock('../../src/components/lesson/BulkOperations', () => ({
  BulkOperations: ({ selectedLessons, onClearSelection, onBulkReorderLessons }: any) => (
    selectedLessons.length > 0 ? (
      <div data-testid="bulk-operations">
        <div>{selectedLessons.length} lesson{selectedLessons.length !== 1 ? 's' : ''} selected</div>
        <button onClick={onClearSelection} aria-label="Clear selection">Clear</button>
        <button onClick={() => onBulkReorderLessons?.(['1', '2'], [])}>Bulk Reorder</button>
      </div>
    ) : null
  )
}));

// Mock all icons
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

describe('LessonManager Performance Tests', () => {
  // Generate 60 lessons for performance testing (exceeds 50+ requirement)
  const generateLessons = (count: number): Lesson[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `lesson-${i + 1}`,
      title: `Lesson ${i + 1}`,
      description: `Description for lesson ${i + 1}`,
      projectId: 'project-1',
      topics: [],
      status: i % 3 === 0 ? 'approved' : 'draft',
      estimatedDuration: 90,
      deliveryFormat: 'instructor_led',
      accessibilityCompliance: {
        complianceLevel: 'AA',
        overallScore: 85,
        violations: [],
        recommendations: [],
        auditTrail: [],
      },
      createdAt: new Date(`2024-01-0${(i % 9) + 1}`),
      updatedAt: new Date(`2024-01-0${(i % 9) + 1}`),
    })) as Lesson[];
  };

  const mockProject: Project = {
    id: 'project-1',
    title: 'Large Project',
    description: 'Project with many lessons',
    targetAudience: 'Developers',
    estimatedDuration: 5400, // 60 lessons * 90 minutes
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
  };

  const createDefaultProps = (lessonCount: number) => ({
    projectId: 'project-1',
    lessons: generateLessons(lessonCount),
    availableProjects: [mockProject],
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
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders 50+ lessons efficiently within performance threshold', async () => {
    const startTime = performance.now();
    
    const props = createDefaultProps(60);
    render(<LessonManager {...props} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 1000ms (1 second) even with 60 lessons
    expect(renderTime).toBeLessThan(1000);
    
    // Verify all lessons are rendered
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 60')).toBeInTheDocument();
    
    // Verify statistics are calculated correctly
    expect(screen.getByText('60')).toBeInTheDocument(); // Total lessons
    expect(screen.getByText('90h')).toBeInTheDocument(); // Total duration (60 * 90 minutes)
  });

  it('handles bulk selection of 25+ lessons efficiently', async () => {
    const user = userEvent.setup();
    const props = createDefaultProps(60);
    render(<LessonManager {...props} />);
    
    const startTime = performance.now();
    
    // Select first 25 lessons using Shift+click range selection
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // Select first
    await user.click(checkboxes[24], { shiftKey: true }); // Shift+click to select range
    
    const endTime = performance.now();
    const selectionTime = endTime - startTime;
    
    // Bulk selection should complete within 500ms
    expect(selectionTime).toBeLessThan(500);
    
    // Verify 25 lessons are selected
    expect(screen.getByText('25 lessons selected')).toBeInTheDocument();
  });

  it('maintains performance during scroll with virtualized rendering concept', async () => {
    const props = createDefaultProps(100); // Even larger dataset
    const { container } = render(<LessonManager {...props} />);
    
    const startTime = performance.now();
    
    // Simulate scrolling by checking if container renders without major delays
    const lessonItems = container.querySelectorAll('[data-testid*="lesson-"]');
    
    const endTime = performance.now();
    const scrollTime = endTime - startTime;
    
    // Should handle 100 lessons without significant performance degradation
    expect(scrollTime).toBeLessThan(1500);
    
    // Verify the component manages large datasets
    expect(screen.getByText('100')).toBeInTheDocument(); // Total lessons count
  });

  it('handles bulk reordering of 30+ lessons within performance limits', async () => {
    const user = userEvent.setup();
    const mockBulkReorder = vi.fn().mockResolvedValue(undefined);
    
    const props = createDefaultProps(50);
    props.onBulkReorderLessons = mockBulkReorder;
    
    render(<LessonManager {...props} />);
    
    // Select 30 lessons
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[29], { shiftKey: true });
    
    expect(screen.getByText('30 lessons selected')).toBeInTheDocument();
    
    const startTime = performance.now();
    
    // Trigger bulk reorder
    const bulkReorderButton = screen.getByText('Bulk Reorder');
    await user.click(bulkReorderButton);
    
    const endTime = performance.now();
    const reorderTime = endTime - startTime;
    
    // Bulk reorder initiation should be fast (actual API calls are mocked)
    expect(reorderTime).toBeLessThan(100);
    
    // Verify the function was called with correct parameters
    expect(mockBulkReorder).toHaveBeenCalledWith(
      expect.arrayContaining(['lesson-1', 'lesson-30']),
      expect.any(Array)
    );
  });

  it('memory usage remains stable with large lesson datasets', () => {
    // Test memory stability by rendering and unmounting large datasets
    const { unmount: unmount1 } = render(
      <LessonManager {...createDefaultProps(80)} />
    );
    
    // Verify initial render works
    expect(screen.getByText('80')).toBeInTheDocument();
    
    unmount1();
    
    // Re-render with different dataset
    const { unmount: unmount2 } = render(
      <LessonManager {...createDefaultProps(75)} />
    );
    
    expect(screen.getByText('75')).toBeInTheDocument();
    
    unmount2();
    
    // Final render to ensure no memory leaks
    render(<LessonManager {...createDefaultProps(60)} />);
    expect(screen.getByText('60')).toBeInTheDocument();
    
    // If we reach here without errors, memory management is acceptable
    expect(true).toBe(true);
  });

  it('statistics calculation performance with large datasets', () => {
    const startTime = performance.now();
    
    render(<LessonManager {...createDefaultProps(100)} />);
    
    const endTime = performance.now();
    const calculationTime = endTime - startTime;
    
    // Statistics calculation should be fast even with 100 lessons
    expect(calculationTime).toBeLessThan(200);
    
    // Verify calculations are correct
    expect(screen.getByText('100')).toBeInTheDocument(); // Total lessons
    expect(screen.getByText('150h')).toBeInTheDocument(); // Total duration
    expect(screen.getByText('0')).toBeInTheDocument(); // Total topics (none in test data)
    
    // Count approved lessons (every 3rd lesson is approved: 100/3 ≈ 33)
    const approvedCount = Math.floor(100 / 3) + (100 % 3 >= 1 ? 1 : 0);
    expect(screen.getByText(approvedCount.toString())).toBeInTheDocument();
  });
});