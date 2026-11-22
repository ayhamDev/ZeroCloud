import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('application shell', () => {
  it('boots the shared interface with the product identity', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'ZeroCloudShare' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'ZeroCloud' })).toBeInTheDocument();
  });
  it('clearly identifies this as a project scaffold', () => {
    render(<App />);
    expect(screen.getByText('Product implementation has not started.')).toBeInTheDocument();
  });
});
