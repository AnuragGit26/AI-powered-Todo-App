import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useIdleLogout } from '../hooks/useIdleLogout';
import { signOutAndCleanup } from '../lib/sessionUtils';

interface Props {
  idleMs?: number;
  warningMs?: number;
}

export const IdleTimeoutGuard: React.FC<Props> = ({ idleMs = 30 * 60 * 1000, warningMs = 60 * 1000 }) => {
  const onTimeout = useCallback(async () => {
    await signOutAndCleanup({ scope: 'local', clearAll: true });
    try { window.location.assign('/login'); } catch { /* noop */ }
  }, []);

  const { isWarning, remainingMs, extendSession } = useIdleLogout({ idleMs, warningMs, onTimeout });

  const onStaySignedIn = async () => {
    try {
      await extendSession();
    } catch (err) {
      console.error("Failed to extend session:", err);
    }
  };

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

  return (
    <AnimatePresence>
      {isWarning && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-yellow-500"><AlertCircle className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">You are about to be signed out</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Due to inactivity, you will be signed out in <span className="font-semibold">{seconds}s</span>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-end">
              <Button onClick={onStaySignedIn} className="bg-blue-600 hover:bg-blue-700 text-white">
                Stay signed in
              </Button>
              <Button onClick={onTimeout} variant="destructive">
                Sign out now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
