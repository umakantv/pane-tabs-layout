import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelloWorld } from './HelloWorld';

describe('HelloWorld', () => {
  it('renders hello world', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello World!')).toBeInTheDocument();
  });

  it('renders with custom name', () => {
    render(<HelloWorld name="Grok" />);
    expect(screen.getByText('Hello Grok!')).toBeInTheDocument();
  });
});