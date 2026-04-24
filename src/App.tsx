import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import SignInModal from './components/modals/SignInModal';
import UpgradeModal from './components/modals/UpgradeModal';
import ToastHost from './components/toasts/Toast';
import { usePlan } from './hooks/usePlan';

function PlanLoader() {
  usePlan();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PlanLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:slug" element={<Room />} />
      </Routes>
      <SignInModal />
      <UpgradeModal />
      <ToastHost />
    </BrowserRouter>
  );
}
