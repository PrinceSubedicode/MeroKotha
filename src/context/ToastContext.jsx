import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]);
  const error = useCallback((msg, dur) => addToast(msg, 'error', dur), [addToast]);
  const warning = useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]);
  const info = useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]);

  const showToast = useCallback((msgOrObj, type = 'success', duration = 3500) => {
    if (msgOrObj && typeof msgOrObj === 'object') {
      const { message, type: objType, title } = msgOrObj;
      const fullMsg = title ? `${title}: ${message}` : message;
      addToast(fullMsg, objType || 'success', duration);
    } else {
      addToast(msgOrObj, type, duration);
    }
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, showToast, success, error, warning, info, removeToast }}>
      {children}
      
      {/* Toast Notification Portal / List */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none" id="toast-portal-container">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let bgColor = 'bg-blue-50 border-blue-200 text-blue-800';
            let iconColor = 'text-blue-500';

            if (t.type === 'success') {
              Icon = CheckCircle;
              bgColor = 'bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100';
              iconColor = 'text-emerald-600 dark:text-emerald-400';
            } else if (t.type === 'error') {
              Icon = AlertTriangle;
              bgColor = 'bg-rose-50 border-rose-100 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100';
              iconColor = 'text-rose-600 dark:text-rose-400';
            } else if (t.type === 'warning') {
              Icon = AlertTriangle;
              bgColor = 'bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100';
              iconColor = 'text-amber-600 dark:text-amber-400';
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto backdrop-blur-md ${bgColor}`}
                id={`toast-${t.id}`}
              >
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-grow text-xs font-medium leading-relaxed">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
