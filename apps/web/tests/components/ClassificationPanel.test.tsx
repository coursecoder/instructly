import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClassificationPanel } from '../../src/components/ai/ClassificationPanel';
import type { Topic } from '@instructly/shared/types';

// Mock Hero Icons
vi.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: () => <div data-testid="chevron-down">↓</div>,
  ChevronUpIcon: () => <div data-testid="chevron-up">↑</div>,
  CheckCircleIcon: () => <div data-testid="check-circle">✓</div>,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle">⚠</div>,
  InformationCircleIcon: () => <div data-testid="information-circle">ℹ</div>
}));

describe('ClassificationPanel', () => {
  const mockTopic: Topic = {
    id: 'test-topic-1',
    content: 'JavaScript fundamentals and basic syntax',
    classification: 'concepts',
    aiAnalysis: {
      contentType: 'programming concepts and syntax',
      rationale: 'This topic involves understanding abstract programming concepts and language syntax. It requires conceptual understanding rather than memorization of specific facts or step-by-step procedures.',
      recommendedMethods: [
        'Interactive coding examples',
        'Conceptual diagrams and visualizations',
        'Guided practice with immediate feedback',
        'Real-world application scenarios'
      ],
      confidence: 0.92,
      modelUsed: 'gpt-3.5-turbo'
    },
    generatedAt: new Date('2023-12-01T10:00:00Z')
  };

  const mockOnAccept = vi.fn();
  const mockOnModify = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render topic information correctly', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      expect(screen.getByText('1')).toBeInTheDocument(); // Index number
      expect(screen.getByText('JavaScript fundamentals and basic syntax')).toBeInTheDocument();
      expect(screen.getByText('Concepts')).toBeInTheDocument(); // Capitalized classification
      expect(screen.getByText('92% confidence')).toBeInTheDocument();
      expect(screen.getByText('Model: gpt-3.5-turbo')).toBeInTheDocument();
      expect(screen.getByText(/Content Type:.*programming concepts and syntax/)).toBeInTheDocument();
    });

    it('should show recommended methods preview', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      expect(screen.getByText(/Recommended Methods:/)).toBeInTheDocument();
      expect(screen.getByText(/Interactive coding examples, Conceptual diagrams and visualizations.../)).toBeInTheDocument();
    });

    it('should not show action buttons by default', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      expect(screen.queryByText('Accept')).not.toBeInTheDocument();
      expect(screen.queryByText('Modify')).not.toBeInTheDocument();
    });

    it('should show action buttons when callbacks provided', () => {
      render(
        <ClassificationPanel 
          topic={mockTopic} 
          index={1} 
          onAccept={mockOnAccept}
          onModify={mockOnModify}
        />
      );

      expect(screen.getByText('Accept')).toBeInTheDocument();
      expect(screen.getByText('Modify')).toBeInTheDocument();
    });
  });

  describe('Classification Styling', () => {
    it('should apply correct styling for concepts classification', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const badge = screen.getByText('Concepts');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should apply correct styling for facts classification', () => {
      const factsTopic = { ...mockTopic, classification: 'facts' as const };
      render(<ClassificationPanel topic={factsTopic} index={1} />);

      const badge = screen.getByText('Facts');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should apply correct styling for processes classification', () => {
      const processesTopic = { ...mockTopic, classification: 'processes' as const };
      render(<ClassificationPanel topic={processesTopic} index={1} />);

      const badge = screen.getByText('Processes');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800');
    });

    it('should apply correct styling for procedures classification', () => {
      const proceduresTopic = { ...mockTopic, classification: 'procedures' as const };
      render(<ClassificationPanel topic={proceduresTopic} index={1} />);

      const badge = screen.getByText('Procedures');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('should apply correct styling for principles classification', () => {
      const principlesTopic = { ...mockTopic, classification: 'principles' as const };
      render(<ClassificationPanel topic={principlesTopic} index={1} />);

      const badge = screen.getByText('Principles');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Confidence Indicators', () => {
    it('should show high confidence with green color and check icon', () => {
      const highConfidenceTopic = { 
        ...mockTopic, 
        aiAnalysis: { ...mockTopic.aiAnalysis, confidence: 0.95 }
      };
      
      render(<ClassificationPanel topic={highConfidenceTopic} index={1} />);

      const confidence = screen.getByText('95% confidence');
      expect(confidence).toHaveClass('text-green-600');
      expect(screen.getByTestId('check-circle')).toBeInTheDocument();
    });

    it('should show medium confidence with yellow color and warning icon', () => {
      const mediumConfidenceTopic = { 
        ...mockTopic, 
        aiAnalysis: { ...mockTopic.aiAnalysis, confidence: 0.70 }
      };
      
      render(<ClassificationPanel topic={mediumConfidenceTopic} index={1} />);

      const confidence = screen.getByText('70% confidence');
      expect(confidence).toHaveClass('text-yellow-600');
      expect(screen.getByTestId('exclamation-triangle')).toBeInTheDocument();
    });

    it('should show low confidence with red color and info icon', () => {
      const lowConfidenceTopic = { 
        ...mockTopic, 
        aiAnalysis: { ...mockTopic.aiAnalysis, confidence: 0.45 }
      };
      
      render(<ClassificationPanel topic={lowConfidenceTopic} index={1} />);

      const confidence = screen.getByText('45% confidence');
      expect(confidence).toHaveClass('text-red-600');
      expect(screen.getByTestId('information-circle')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should start in collapsed state', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      expect(screen.queryByText('Classification Rationale')).not.toBeInTheDocument();
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should expand when expand button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      expect(screen.getByText('Classification Rationale')).toBeInTheDocument();
      expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
    });

    it('should show full rationale when expanded', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      expect(screen.getByText(mockTopic.aiAnalysis.rationale)).toBeInTheDocument();
    });

    it('should show complete recommended methods when expanded', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      expect(screen.getByText('Recommended Instructional Methods')).toBeInTheDocument();
      
      mockTopic.aiAnalysis.recommendedMethods.forEach((method, index) => {
        expect(screen.getByText(method)).toBeInTheDocument();
        expect(screen.getByText((index + 1).toString())).toBeInTheDocument(); // Numbered list
      });
    });

    it('should show analysis metadata when expanded', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
      expect(screen.getByText(/ID:/)).toBeInTheDocument();
    });

    it('should collapse when collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      // Expand first
      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);
      expect(screen.getByText('Classification Rationale')).toBeInTheDocument();

      // Then collapse
      const collapseButton = screen.getByLabelText('Collapse details');
      await user.click(collapseButton);
      expect(screen.queryByText('Classification Rationale')).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should call onAccept when Accept button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ClassificationPanel 
          topic={mockTopic} 
          index={1} 
          onAccept={mockOnAccept}
        />
      );

      const acceptButton = screen.getByText('Accept');
      await user.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(mockTopic);
    });

    it('should call onModify when Modify button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ClassificationPanel 
          topic={mockTopic} 
          index={1} 
          onModify={mockOnModify}
        />
      );

      const modifyButton = screen.getByText('Modify');
      await user.click(modifyButton);

      expect(mockOnModify).toHaveBeenCalledWith(mockTopic);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for expand/collapse button', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      expect(screen.getByLabelText('Expand details')).toBeInTheDocument();
    });

    it('should have proper button minimum heights', () => {
      render(
        <ClassificationPanel 
          topic={mockTopic} 
          index={1} 
          onAccept={mockOnAccept}
          onModify={mockOnModify}
        />
      );

      const acceptButton = screen.getByText('Accept');
      const modifyButton = screen.getByText('Modify');

      expect(acceptButton).toHaveClass('min-h-[44px]');
      expect(modifyButton).toHaveClass('min-h-[44px]');
    });

    it('should provide title attribute for long topic content', () => {
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const topicHeader = screen.getByText(mockTopic.content);
      expect(topicHeader).toHaveAttribute('title', mockTopic.content);
    });
  });

  describe('Content Truncation', () => {
    it('should truncate recommended methods preview for many methods', () => {
      const manyMethodsTopic = {
        ...mockTopic,
        aiAnalysis: {
          ...mockTopic.aiAnalysis,
          recommendedMethods: [
            'Method 1',
            'Method 2', 
            'Method 3',
            'Method 4',
            'Method 5'
          ]
        }
      };

      render(<ClassificationPanel topic={manyMethodsTopic} index={1} />);

      expect(screen.getByText(/Method 1, Method 2.../)).toBeInTheDocument();
    });

    it('should show all methods when only 2 or fewer', () => {
      const fewMethodsTopic = {
        ...mockTopic,
        aiAnalysis: {
          ...mockTopic.aiAnalysis,
          recommendedMethods: ['Method 1', 'Method 2']
        }
      };

      render(<ClassificationPanel topic={fewMethodsTopic} index={1} />);

      expect(screen.getByText(/Method 1, Method 2$/)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format generation date correctly when expanded', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      // Should show formatted date
      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
    });
  });

  describe('ID Display', () => {
    it('should show truncated ID when expanded', async () => {
      const user = userEvent.setup();
      render(<ClassificationPanel topic={mockTopic} index={1} />);

      const expandButton = screen.getByLabelText('Expand details');
      await user.click(expandButton);

      // Should show first 8 characters of ID plus ellipsis
      const expectedIdDisplay = `${mockTopic.id.slice(0, 8)}...`;
      expect(screen.getByText(`ID: ${expectedIdDisplay}`)).toBeInTheDocument();
    });
  });
});