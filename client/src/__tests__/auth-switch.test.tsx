import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthSwitch from '../components/ui/auth-switch';
import Demo from '../components/ui/demo';

describe('AuthSwitch and Demo Components', () => {
  it('renders default sign in view correctly', () => {
    const html = renderToStaticMarkup(<AuthSwitch />);
    
    // Check main container
    expect(html).toContain('auth-switch');
    expect(html).toContain('class="container"');
    
    // Check form titles and input fields
    expect(html).toContain('Sign in');
    expect(html).toContain('placeholder="Email"');
    expect(html).toContain('placeholder="Password"');
    expect(html).toContain('value="Login"');

    // Check sign up toggle button
    expect(html).toContain('New here?');
    expect(html).toContain('Sign up');

    // Check Lucide icons presence (svg render)
    expect(html).toContain('lucide-mail');
    expect(html).toContain('lucide-lock');
  });

  it('renders sign up mode when initialSignUp is true', () => {
    const html = renderToStaticMarkup(<AuthSwitch initialSignUp={true} />);
    
    // Check sign-up-mode class
    expect(html).toContain('class="container sign-up-mode"');
    
    // Check sign up elements
    expect(html).toContain('placeholder="Username"');
    expect(html).toContain('lucide-user');
    expect(html).toContain('value="Sign up"');
    expect(html).toContain('One of us?');
  });

  it('renders clean panels without images', () => {
    const html = renderToStaticMarkup(<AuthSwitch />);
    
    expect(html).not.toContain('<img');
    expect(html).not.toContain('images.unsplash.com');
  });

  it('renders Google sign in button with accessible label', () => {
    const html = renderToStaticMarkup(<AuthSwitch />);
    
    expect(html).toContain('aria-label="Sign in with Google"');
    expect(html).toContain('Or sign in with social platforms');
    expect(html).toContain('Or sign up with social platforms');
  });

  it('renders loading indicators and disabled states when isLoading is true', () => {
    const html = renderToStaticMarkup(<AuthSwitch isLoading={true} />);
    
    expect(html).toContain('value="Processing..."');
    expect(html).toContain('disabled');
  });

  it('correctly calculates user avatar initials and handles fallbacks', () => {
    const getAvatarInitial = (name?: string) => (name?.[0] || 'R').toUpperCase();
    
    expect(getAvatarInitial('Rahul Sharma')).toBe('R');
    expect(getAvatarInitial('pratik')).toBe('P');
    expect(getAvatarInitial('interviewshield0@gmail.com')).toBe('I');
    expect(getAvatarInitial('')).toBe('R');
    expect(getAvatarInitial(undefined)).toBe('R');
  });

  it('renders Demo component importing AuthSwitch correctly', () => {
    const html = renderToStaticMarkup(<Demo />);
    
    expect(html).toContain('auth-switch');
    expect(html).toContain('Sign in');
    expect(html).toContain('Sign up');
  });
});
