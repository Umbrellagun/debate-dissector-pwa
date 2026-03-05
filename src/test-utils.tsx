import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context';

interface WrapperProps {
  children: React.ReactNode;
}

const AllTheProviders: React.FC<WrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
