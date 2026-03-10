import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Trash2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', title: '', confirmLabel: 'Delete', variant: 'danger' });
  const confirmResolveRef = useRef(null);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirm = useCallback((message, title = 'Confirm Action', options = {}) => {
    return new Promise(resolve => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({
        open: true,
        message,
        title,
        confirmLabel: options.confirmLabel || 'Delete',
        variant: options.variant || 'danger',
      });
    });
  }, []);

  const handleConfirm = () => {
    setConfirmDialog(d => ({ ...d, open: false }));
    confirmResolveRef.current?.(true);
  };

  const handleCancel = () => {
    setConfirmDialog(d => ({ ...d, open: false }));
    confirmResolveRef.current?.(false);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        {confirmDialog.open && (
          <ConfirmModal
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            variant={confirmDialog.variant}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

const toastStyles = {
  success: {
    wrapper: 'bg-white border-l-4 border-green-500',
    icon: 'text-green-500',
    title: 'text-green-700',
    text: 'text-gray-600',
    progress: 'bg-green-500',
  },
  error: {
    wrapper: 'bg-white border-l-4 border-red-500',
    icon: 'text-red-500',
    title: 'text-red-700',
    text: 'text-gray-600',
    progress: 'bg-red-500',
  },
  warning: {
    wrapper: 'bg-white border-l-4 border-yellow-500',
    icon: 'text-yellow-500',
    title: 'text-yellow-700',
    text: 'text-gray-600',
    progress: 'bg-yellow-500',
  },
  info: {
    wrapper: 'bg-white border-l-4 border-blue-500',
    icon: 'text-blue-500',
    title: 'text-blue-700',
    text: 'text-gray-600',
    progress: 'bg-blue-500',
  },
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastTitles = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

function Toast({ t, onRemove }) {
  const style = toastStyles[t.type] || toastStyles.info;
  const Icon = toastIcons[t.type] || Info;
  const title = toastTitles[t.type] || 'Info';
  const duration = t.duration || 4000;

  return (
    <div className={`toast-enter flex flex-col rounded-lg shadow-lg pointer-events-auto overflow-hidden ${style.wrapper}`}>
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${style.title}`}>{title}</p>
          <p className={`text-sm mt-0.5 ${style.text} break-words`}>{t.message}</p>
        </div>
        <button
          onClick={() => onRemove(t.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full ${style.progress} origin-left`}
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} t={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, variant, onConfirm, onCancel }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isDanger ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {isDanger
              ? <Trash2 className="w-5 h-5 text-red-600" />
              : <AlertCircle className="w-5 h-5 text-yellow-600" />
            }
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
