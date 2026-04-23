import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import SignInModal from './components/modals/SignInModal';
import ToastHost from './components/toasts/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:slug" element={<Room />} />
      </Routes>
      <SignInModal />
      <ToastHost />
    </BrowserRouter>
  );
}
