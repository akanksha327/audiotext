import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <BrowserRouter>
          {/* Global Keyboard Navigation Controller */}
          <CommandPalette />
          
          {/* App Routing Engine */}
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </ToastProvider>
  );
}
