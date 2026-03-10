import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Trash2 } from 'lucide-react';

const ToastContext = createContext(null);

const ConfirmContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', title: '' });
  const confirmResolveRef = useRef(null);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const confirm = useCallback((message, title = 'Confirm Action') => {
    return new Promise(resolve => {
      confirmResolveRef.current = resolve;
      setConfirmDialog({ open: true, message, title });
    });
  }, []);

  const handleConfirm = () => {
    setConfirmDialog({ open: false, message: '', title: '' });
    confirmResolveRef.current?.(true);
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, message: '', title: '' });
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
  },
  error: {
    wrapper: 'bg-white border-l-4 border-red-500',
    icon: 'text-red-500',
    title: 'text-red-700',
    text: 'text-gray-600',
  },
  warning: {
    wrapper: 'bg-white border-l-4 border-yellow-500',
    icon: 'text-yellow-500',
    title: 'text-yellow-700',
    text: 'text-gray-600',
  },
  info: {
    wrapper: 'bg-white border-l-4 border-blue-500',
    icon: 'text-blue-500',
    title: 'text-blue-700',
    text: 'text-gray-600',
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

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
      {toasts.map(t => {
        const style = toastStyles[t.type] || toastStyles.info;
        const Icon = toastIcons[t.type] || Info;
        const title = toastTitles[t.type] || 'Info';
        return (
          <div
            key={t.id}
            className={`toast-enter flex items-start gap-3 p-4 rounded-lg shadow-lg pointer-events-auto ${style.wrapper}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${style.title}`}>{title}</p>
              <p className={`text-sm mt-0.5 ${style.text}`}>{t.message}</p>
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9998]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
