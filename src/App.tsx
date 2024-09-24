import * as React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { Sale } from './Sale';

export default function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Sale />
      </Box>
    </Container>
  );
}
