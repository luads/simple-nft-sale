import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Purchase } from './Purchase';
import { Sale } from './Sale';

const router = createHashRouter([
  {
    path: "/",
    element: <Sale />,
  },
  {
    path: "/purchase",
    element: <Purchase />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
