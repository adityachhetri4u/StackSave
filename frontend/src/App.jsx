import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RecommendationProvider } from './contexts/RecommendationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CardWallet from './pages/CardWallet';
import Recommend from './pages/Recommend';
import History from './pages/History';
import ProductScraper from './pages/ProductScraper';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RecommendationProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes inside layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cards" element={<CardWallet />} />
              <Route path="/recommend" element={<Recommend />} />
              <Route path="/history" element={<History />} />
              <Route path="/product-scraper" element={<ProductScraper />} />
            </Route>

            {/* Redirect root to product scraper */}
            <Route path="/" element={<Navigate to="/product-scraper" replace />} />
            <Route path="*" element={<Navigate to="/product-scraper" replace />} />
          </Routes>
        </RecommendationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
