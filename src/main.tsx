import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App.tsx';
import './index.css';
import 'antd/dist/reset.css';

// Suppress React findDOMNode warning specifically for ReactQuill
// This is a known issue with react-quill library that doesn't affect functionality
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Filter out findDOMNode warnings from ReactQuill
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode is deprecated')
  ) {
    return;
  }
  // Allow all other warnings to pass through
  originalConsoleWarn.apply(console, args);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
