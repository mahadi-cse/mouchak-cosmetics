import { render as rtlRender, RenderOptions } from '@testing-library/react';
import React from 'react';
import QueryProvider from '@/shared/providers/QueryProvider';

function render(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <QueryProvider>{children}</QueryProvider>,
    ...options,
  });
}

export * from '@testing-library/react';
export { render };
