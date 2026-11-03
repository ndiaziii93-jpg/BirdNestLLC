'use client';
import { useStore } from '@/store/StoreProvider';

export function ErrorBar() {
  const { error, clearError } = useStore();
  if (!error) return null;
  return (
    <div className="errbar" role="alert">
      <span>Could not save: {error}</span>
      <button onClick={clearError} aria-label="Dismiss">×</button>
    </div>
  );
}
