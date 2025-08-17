import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import LoginPage from '../../src/app/auth/login/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock the auth store
const mockSignIn = vi.fn();
let mockAuthStore = {
  signIn: mockSignIn,
  isLoading: false,
  error: null as string | null,
};

vi.mock('../../src/stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    // Reset mock store state
    mockAuthStore.isLoading = false;
    mockAuthStore.error = null;
  });

  it('renders login form with all required elements', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });
    const form = submitButton.closest('form')!;
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });
    const form = submitButton.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password requirement', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });
    const form = submitButton.closest('form')!;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockSignIn.mockResolvedValueOnce({});
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('displays loading state during sign in', () => {
    mockAuthStore.isLoading = true;
    
    render(<LoginPage />);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to your account/i })).toBeDisabled();
  });

  it('displays error message when sign in fails', () => {
    mockAuthStore.error = 'Invalid credentials';
    
    render(<LoginPage />);
    
    expect(screen.getByText(/sign in failed/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('clears validation error when user starts typing', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });
    const form = submitButton.closest('form')!;

    // Trigger validation error
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 'test' } });
    
    expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in to your account/i });

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(emailInput).toHaveAttribute('required');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(passwordInput).toHaveAttribute('required');

    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('navigates to register page', () => {
    render(<LoginPage />);
    
    const registerLink = screen.getByText(/sign up here/i);
    expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');
  });

  it('navigates to forgot password page', () => {
    render(<LoginPage />);
    
    const forgotPasswordLink = screen.getByText(/forgot your password/i);
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/auth/reset-password');
  });
});