import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { Privacy, Terms, Refunds } from './pages/Legal';
import SignInModal from './components/modals/SignInModal';
import UpgradeModal from './components/modals/UpgradeModal';
import CreateRoomModal from './components/modals/CreateRoomModal';
import FeedbackModal from './components/modals/FeedbackModal';
import ToastHost from './components/toasts/Toast';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { usePlan } from './hooks/usePlan';

function PlanLoader() {
  usePlan();
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PlanLoader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/r/:slug" element={<Room />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SignInModal />
        <UpgradeModal />
        <CreateRoomModal />
        <FeedbackModal />
        <ToastHost />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
