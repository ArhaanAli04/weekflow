import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { WeekFlowToaster } from './components/ui/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <WeekFlowToaster />
    </BrowserRouter>
  );
}
