import React from 'react';
import { AlertTriangle, Trash2, CheckCircle, X, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

/**
 * Reusable Confirmation Dialog Component
 * 
 * Usage:
 * <ConfirmDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={handleDelete}
 *   title="Davetiyeyi Sil"
 *   message="Bu davetiyeyi silmek istediğinize emin misiniz?"
 *   type="danger"
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'warning',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-100',
          text: 'text-red-900',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-900',
          button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        };
      case 'success':
        return {
          bg: 'bg-green-100',
          text: 'text-green-900',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        };
      case 'info':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-900',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 animate-fade-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className={`${colors.bg} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
            {getIcon()}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 sm:py-2.5 ${colors.button} text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-target`}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
