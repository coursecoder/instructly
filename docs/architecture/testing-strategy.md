# Testing Strategy

## Testing Pyramid
```
                  E2E Tests
                 /        \
            Integration Tests
               /            \
          Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests
```
apps/web/tests/
├── components/          # Component unit tests
│   ├── ai/
│   ├── accessibility/
│   └── lesson/
├── hooks/              # Custom hook tests
├── services/           # API service tests
├── integration/        # Integration tests
└── e2e/               # End-to-end tests
```

### Backend Tests
```
apps/api/tests/
├── functions/          # Function unit tests
├── services/           # Service unit tests
├── middleware/         # Middleware tests
└── integration/        # API integration tests
```

### E2E Tests
```
tests/e2e/
├── lesson-creation.spec.ts
├── ai-generation.spec.ts
├── accessibility-compliance.spec.ts
└── stakeholder-workflow.spec.ts
```

## Test Examples

### Frontend Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AIClassificationPanel } from '@/components/ai/ClassificationPanel';

describe('AIClassificationPanel', () => {
  const mockAnalysis = {
    contentType: 'concepts',
    rationale: 'Test rationale',
    confidence: 0.85,
    recommendedMethods: ['categorization']
  };

  it('should display classification with confidence score', () => {
    render(
      <AIClassificationPanel 
        analysis={mockAnalysis}
        onAccept={jest.fn()}
        onModify={jest.fn()}
      />
    );

    expect(screen.getByText('concepts')).toBeInTheDocument();
    expect(screen.getByText('85% Confidence')).toBeInTheDocument();
  });

  it('should call onAccept when accept button is clicked', () => {
    const onAccept = jest.fn();
    render(
      <AIClassificationPanel 
        analysis={mockAnalysis}
        onAccept={onAccept}
        onModify={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Accept Classification'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
```

### Backend API Test
```typescript
import { describe, it, expect } from 'vitest';
import { testClient } from '../utils/test-client';

describe('/api/ai/analyze', () => {
  it('should analyze topics and return classifications', async () => {
    const response = await testClient
      .post('/api/ai/analyze')
      .send({
        topics: ['Learning about databases'],
        analysisType: 'clark_mayer'
      })
      .expect(200);

    expect(response.body).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          contentType: expect.stringMatching(/facts|concepts|processes|procedures|principles/),
          confidence: expect.any(Number),
          rationale: expect.any(String)
        })
      ])
    });
  });

  it('should require authentication', async () => {
    await testClient
      .post('/api/ai/analyze')
      .send({ topics: ['test'] })
      .expect(401);
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete lesson creation workflow', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('[data-testid=email]', 'test@instructly.com');
  await page.fill('[data-testid=password]', 'testpassword123');
  await page.click('[data-testid=login-button]');

  // Create new project
  await page.goto('/dashboard');
  await page.click('[data-testid=new-project-button]');
  await page.fill('[data-testid=project-title]', 'Test Project');
  await page.click('[data-testid=create-project]');

  // Create lesson
  await page.click('[data-testid=new-lesson-button]');
  await page.fill('[data-testid=lesson-title]', 'Test Lesson');
  await page.fill('[data-testid=topic-input]', 'Learning database concepts');
  
  // Analyze content
  await page.click('[data-testid=analyze-button]');
  await expect(page.locator('[data-testid=classification-result]')).toBeVisible();
  
  // Generate content
  await page.click('[data-testid=generate-content]');
  await expect(page.locator('[data-testid=lesson-content]')).toBeVisible();
  
  // Verify accessibility compliance
  await expect(page.locator('[data-testid=compliance-status]')).toContainText('WCAG AA');
});
```
