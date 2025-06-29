import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

const theme = createTheme();

const AppWithProviders = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);

test('renders literature review database', () => {
  render(<AppWithProviders />);
  const titleElement = screen.getByText(/Literature Review Database/i);
  expect(titleElement).toBeInTheDocument();
});