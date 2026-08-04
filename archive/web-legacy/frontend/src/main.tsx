import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './components/Auth/AuthProvider'
import { logWebVitals, logBundleSize, logMemoryUsage } from './utils/performance'
import './index.css'

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  logWebVitals();
  setTimeout(() => {
    logBundleSize();
    logMemoryUsage();
  }, 3000);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <App />
        <Toaster 
          position="top-center"
          containerStyle={{
            zIndex: 99999
          }}
          toastOptions={{
            duration: 6000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              duration: 8000,
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
