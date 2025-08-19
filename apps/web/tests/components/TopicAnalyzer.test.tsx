import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicAnalyzer } from '../../src/components/lesson/TopicAnalyzer';
import { useAIStore } from '../../src/stores/aiStore';
import type { Topic, TopicAnalysisResponse } from '@instructly/shared/types';

// Mock the AI store
vi.mock('../../src/stores/aiStore', () => ({
  useAIStore: vi.fn()
}));

// Mock Hero Icons
vi.mock('@heroicons/react/24/outline', () => ({
  PlusIcon: () => <div data-testid="plus-icon">+</div>,
  XMarkIcon: () => <div data-testid="x-mark-icon">×</div>,
  PlayIcon: () => <div data-testid="play-icon">▶</div>
}));

describe('TopicAnalyzer', () => {
  const mockAnalyzeTopics = vi.fn();
  const mockGetMonthlyCost = vi.fn();
  const mockClearAnalysisResults = vi.fn();
  const mockClearError = vi.fn();

  const defaultStoreState = {
    analysisResults: null,
    isAnalyzing: false,
    analysisError: null,
    analyzeTopics: mockAnalyzeTopics,
    clearAnalysisResults: mockClearAnalysisResults,
    clearError: mockClearError,
    monthlyCost: 5.50,
    costLimit: 50,
    withinCostLimits: true,
    getMonthlyCost: mockGetMonthlyCost
  };

  beforeEach(() => {
    vi.mocked(useAIStore).mockReturnValue(defaultStoreState);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render with default state', () => {
      render(<TopicAnalyzer />);

      expect(screen.getByText('AI Topic Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Enter topics to analyze/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // First topic input
      expect(screen.getByRole('button', { name: /analyze topics/i })).toBeInTheDocument();
    });

    it('should call getMonthlyCost on mount', () => {
      render(<TopicAnalyzer />);
      expect(mockGetMonthlyCost).toHaveBeenCalledTimes(1);
    });

    it('should display cost information', () => {
      render(<TopicAnalyzer />);

      expect(screen.getByText('Monthly AI Usage:')).toBeInTheDocument();
      expect(screen.getByText('$5.50 / $50.00')).toBeInTheDocument();
    });

    it('should show cost limit warning when limit exceeded', () => {
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        withinCostLimits: false,
        monthlyCost: 55
      });

      render(<TopicAnalyzer />);

      expect(screen.getByText('Monthly limit reached. Analysis temporarily disabled.')).toBeInTheDocument();
    });
  });

  describe('Topic Input Management', () => {
    it('should allow adding topics up to limit', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      const addButton = screen.getByRole('button', { name: /add topic/i });

      // Should start with 1 input
      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(1);

      // Add topics
      await user.click(addButton);
      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(2);

      await user.click(addButton);
      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(3);
    });

    it('should not allow adding more than 10 topics', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      const addButton = screen.getByRole('button', { name: /add topic/i });

      // Add 9 more topics (starts with 1)
      for (let i = 0; i < 9; i++) {
        await user.click(addButton);
      }

      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(10);

      // Add button should be hidden when at limit
      expect(screen.queryByRole('button', { name: /add topic/i })).not.toBeInTheDocument();
    });

    it('should allow removing topics except the last one', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      // Add a topic first
      await user.click(screen.getByRole('button', { name: /add topic/i }));
      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(2);

      // Should now have remove buttons
      const removeButtons = screen.getAllByLabelText(/remove topic/i);
      expect(removeButtons).toHaveLength(2);

      // Remove one topic
      await user.click(removeButtons[0]);
      expect(screen.getAllByPlaceholderText(/topic \d+/i)).toHaveLength(1);

      // Should not have remove button when only one topic remains
      expect(screen.queryByLabelText(/remove topic/i)).not.toBeInTheDocument();
    });

    it('should update topic content when typed', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      const topicInput = screen.getByPlaceholderText('Topic 1');
      await user.type(topicInput, 'JavaScript fundamentals');

      expect(topicInput).toHaveValue('JavaScript fundamentals');
    });
  });

  describe('Analysis Type Selection', () => {
    it('should allow changing analysis type', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      const select = screen.getByLabelText('Analysis Framework');
      expect(select).toHaveValue('instructional_design');

      await user.selectOptions(select, 'bloom_taxonomy');
      expect(select).toHaveValue('bloom_taxonomy');
    });
  });

  describe('Analysis Execution', () => {
    it('should call analyzeTopics when analyze button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnComplete = vi.fn();
      
      mockAnalyzeTopics.mockResolvedValue({
        topics: [{
          id: 'test-1',
          content: 'JavaScript basics',
          classification: 'concepts',
          aiAnalysis: {
            contentType: 'programming concepts',
            rationale: 'Test rationale',
            recommendedMethods: ['hands-on practice'],
            confidence: 0.9,
            modelUsed: 'gpt-3.5-turbo'
          },
          generatedAt: new Date()
        }],
        totalCost: 0.05,
        processingTime: 1000
      } as TopicAnalysisResponse);

      render(<TopicAnalyzer onAnalysisComplete={mockOnComplete} />);

      const topicInput = screen.getByPlaceholderText('Topic 1');
      await user.type(topicInput, 'JavaScript basics');

      const analyzeButton = screen.getByRole('button', { name: /analyze topics/i });
      await user.click(analyzeButton);

      expect(mockAnalyzeTopics).toHaveBeenCalledWith({
        topics: ['JavaScript basics'],
        analysisType: 'instructional_design'
      });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          topics: expect.any(Array),
          totalCost: 0.05,
          processingTime: 1000
        });
      });
    });

    it('should disable analyze button when no topics entered', () => {
      render(<TopicAnalyzer />);

      const analyzeButton = screen.getByRole('button', { name: /analyze topics/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('should disable analyze button when cost limit exceeded', () => {
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        withinCostLimits: false
      });

      render(<TopicAnalyzer />);

      const analyzeButton = screen.getByRole('button', { name: /analyze topics/i });
      expect(analyzeButton).toBeDisabled();
    });

    it('should show loading state during analysis', () => {
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        isAnalyzing: true
      });

      render(<TopicAnalyzer />);

      expect(screen.getByText('Analyzing Topics...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyzing topics/i })).toBeDisabled();
    });

    it('should not call analyzeTopics for empty topics', async () => {
      const user = userEvent.setup();
      render(<TopicAnalyzer />);

      // Add empty topic
      const topicInput = screen.getByPlaceholderText('Topic 1');
      await user.type(topicInput, '   '); // Just spaces

      const analyzeButton = screen.getByRole('button', { name: /analyze topics/i });
      expect(analyzeButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display analysis errors', () => {
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        analysisError: 'AI service temporarily unavailable'
      });

      render(<TopicAnalyzer />);

      expect(screen.getByText('Analysis Error')).toBeInTheDocument();
      expect(screen.getByText('AI service temporarily unavailable')).toBeInTheDocument();
    });
  });

  describe('Results Display', () => {
    const mockResults: Topic[] = [{
      id: 'test-1',
      content: 'JavaScript basics',
      classification: 'concepts',
      aiAnalysis: {
        contentType: 'programming concepts',
        rationale: 'This involves understanding programming concepts',
        recommendedMethods: ['hands-on practice', 'examples'],
        confidence: 0.9,
        modelUsed: 'gpt-3.5-turbo'
      },
      generatedAt: new Date()
    }];

    it('should display analysis results when available', () => {
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        analysisResults: mockResults
      });

      render(<TopicAnalyzer />);

      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('JavaScript basics')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyze new topics/i })).toBeInTheDocument();
    });

    it('should allow resetting analysis to start over', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useAIStore).mockReturnValue({
        ...defaultStoreState,
        analysisResults: mockResults
      });

      render(<TopicAnalyzer />);

      const resetButton = screen.getByRole('button', { name: /analyze new topics/i });
      await user.click(resetButton);

      expect(mockClearAnalysisResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for form controls', () => {
      render(<TopicAnalyzer />);

      expect(screen.getByLabelText('Analysis Framework')).toBeInTheDocument();
      expect(screen.getByLabelText('Topic 1 input')).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<TopicAnalyzer />);

      expect(screen.getByRole('button', { name: /add topic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /analyze topics/i })).toBeInTheDocument();
    });

    it('should have minimum touch targets of 44px', () => {
      render(<TopicAnalyzer />);

      const analyzeButton = screen.getByRole('button', { name: /analyze topics/i });
      expect(analyzeButton).toHaveClass('min-h-[44px]');
    });
  });
});