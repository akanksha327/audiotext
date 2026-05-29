import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        {/* Global Keyboard Navigation Controller */}
        <CommandPalette />
        
        {/* App Routing Engine */}
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  );
}
