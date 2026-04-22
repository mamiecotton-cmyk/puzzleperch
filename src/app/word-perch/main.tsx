import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import WordPerchRedesign from './page';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WordPerchRedesign />
  </StrictMode>,
);
