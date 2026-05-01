import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-full">
      <Navbar />
      <main className="mx-auto max-w-[640px] px-[22px] py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary">404</p>
        <h1 className="mt-2 text-xl" style={{ color: 'var(--text-primary)' }}>
          Page not found
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          The page you're looking for doesn't exist — or it expired and got swept up.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-btn px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: '#3B6D11' }}
        >
          Back home
        </Link>
      </main>
    </div>
  );
}
