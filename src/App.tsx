import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { AddExpense } from './pages/AddExpense';
import { Analytics } from './pages/Analytics';
import { Planner } from './pages/Planner';
import { Settings } from './pages/Settings';
import { Streak } from './pages/Streak';

export default function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <PrivacyProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/login" element={<Login />} />
              <Route path="/add" element={<AddExpense />} />
              
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/streak" element={<Streak />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </PrivacyProvider>
    </ThemeProvider>
  );
}
