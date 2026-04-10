import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StreamPage from './pages/StreamPage';
import SellerDashboard from './pages/SellerDashboard';
import InfluencerDashboard from './pages/InfluencerDashboard';
import BuyerOrders from './pages/BuyerOrders';
import ProductPage from './pages/ProductPage';
import ProductsPage from './pages/ProductsPage';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WishlistPage from './pages/WishlistPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SellerStorePage from './pages/SellerStorePage';

// Components
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/buyer/CartDrawer';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// ── Protected Route ──
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { refreshMe, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) refreshMe();
  }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <CartDrawer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#112219', color: '#E8F5F0', border: '1px solid rgba(0,194,124,0.3)' },
            success: { iconTheme: { primary: '#00C27C', secondary: '#050D0A' } }
          }}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/stream/:id" element={<StreamPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/checkout" element={
            <ProtectedRoute><CheckoutPage /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><BuyerOrders /></ProtectedRoute>
          } />
          <Route path="/seller/*" element={
            <ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>
          } />
          <Route path="/influencer/*" element={
            <ProtectedRoute roles={['influencer']}><InfluencerDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/wishlist" element={
            <ProtectedRoute><WishlistPage /></ProtectedRoute>
          } />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/store/:id" element={<SellerStorePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
