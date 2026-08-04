import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Layout Components (keep these eager loaded - small and always needed)
import Layout from './components/Layout/Layout'
import LoadingSpinner from './components/UI/LoadingSpinner'
import ErrorBoundary from './components/Common/ErrorBoundary'
import { NetworkStatus } from './components/Common/NetworkStatus'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Eager load critical pages (payment callback needs to be immediate)
import PaymentCallbackPage from './pages/PaymentCallbackPage'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'))
const EditorPage = lazy(() => import('./pages/EditorPageV2'))
const EditorV2TestPage = lazy(() => import('./pages/EditorV2TestPage'))
const EditorV2SimplePage = lazy(() => import('./pages/EditorV2SimplePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const PublicInvitationPage = lazy(() => import('./pages/PublicInvitationPage'))
const RSVPPage = lazy(() => import('./pages/RSVPPage'))
const MediaGalleryPage = lazy(() => import('./pages/MediaGalleryPage'))
const MediaUploadPage = lazy(() => import('./pages/MediaUploadPage'))
const PublicMediaPage = lazy(() => import('./pages/PublicMediaPage'))
const QRManagePage = lazy(() => import('./pages/QRManagePage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <NetworkStatus />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public Invitation View (No Layout) */}
          <Route path="/i/:invitationId" element={<PublicInvitationPage />} />
          
          {/* Public RSVP Page (No Layout) */}
          <Route path="/rsvp/:guestToken" element={<RSVPPage />} />

          {/* Public Media View (No Layout) */}
          <Route path="/media/:qrCode" element={<PublicMediaPage />} />
          {/* Typo redirects */}
          <Route path="/meedia" element={<Navigate to="/media" replace />} />
          <Route path="/meedia/upload" element={<Navigate to="/media/upload" replace />} />

          {/* Payment Callback (No Layout - handles 3D Secure redirect) */}
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />
          
          {/* Test route to verify routing works */}
          <Route path="/test" element={<div style={{ padding: '50px', textAlign: 'center' }}><h1>Test Route Works! ✅</h1></div>} />

          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="auth" element={<AuthPage mode="login" />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="signup" element={<AuthPage mode="signup" />} />
            <Route path="forgot-password" element={<AuthPage mode="forgot" />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            
            {/* Legal Pages */}
            <Route path="legal/:slug" element={<LegalPage />} />
            
            {/* Protected Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="editor/:templateId?" element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            } />
            <Route path="editor-v2-test" element={
              <ProtectedRoute>
                <EditorV2TestPage />
              </ProtectedRoute>
            } />
            <Route path="editor-v2" element={
              <ProtectedRoute>
                <EditorV2SimplePage />
              </ProtectedRoute>
            } />
            <Route path="account" element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            } />
            <Route path="media" element={
              <ProtectedRoute>
                <MediaGalleryPage />
              </ProtectedRoute>
            } />
            <Route path="media/upload" element={
              <ProtectedRoute>
                <MediaUploadPage />
              </ProtectedRoute>
            } />
            <Route path="media/manage" element={
              <ProtectedRoute>
                <QRManagePage />
              </ProtectedRoute>
            } />
            <Route path="qr-manage" element={
              <ProtectedRoute>
                <QRManagePage />
              </ProtectedRoute>
            } />
          </Route>
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App
