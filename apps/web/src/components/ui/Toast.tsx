import { Toaster } from 'react-hot-toast';

export { default as toast } from 'react-hot-toast';

export function WeekFlowToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#161622',
          color: '#FFFFFF',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#22C55E', secondary: '#161622' },
          duration: 3000,
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: '#161622' },
          duration: 4000,
        },
      }}
    />
  );
}
