import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  title?: string;
  type?: 'info' | 'success' | 'error';
  open?: boolean;
  duration?: number;
  placement?: 'bottom-center' | 'bottom-right' | 'top-right';
  onClose?: () => void;
  onClick?: () => void;
}

const icons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const styles = {
  info: 'border-white/[0.12] text-neutral-200',
  success: 'border-emerald-500/30 text-emerald-200',
  error: 'border-rose-500/30 text-rose-200',
};

const placements = {
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-5 right-5',
  'top-right': 'right-5 top-16',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  title,
  type = 'info',
  open = true,
  duration = 3400,
  placement = 'bottom-right',
  onClose,
  onClick,
}) => {
  const reducedMotion = useReducedMotion();
  const Icon = icons[type];
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !onClose || duration <= 0) return;
    const timer = window.setTimeout(() => onCloseRef.current?.(), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  const transitionDuration = reducedMotion ? 0 : 0.18;

  return (
    <div className={`pointer-events-none fixed z-[80] ${placements[placement]}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            role={type === 'error' ? 'alert' : 'status'}
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            initial={reducedMotion ? false : { opacity: 0, x: placement === 'bottom-center' ? 0 : 12, y: placement === 'top-right' ? -6 : 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: placement === 'bottom-center' ? 0 : 8, y: placement === 'top-right' ? -4 : 6 }}
            transition={{ duration: transitionDuration, ease: 'easeOut' }}
            onClick={onClick}
            className={`pointer-events-auto flex max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-lg border bg-[#15181e] px-3.5 py-3 shadow-lg shadow-black/20 ${styles[type]} ${onClick ? 'cursor-pointer' : ''}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {title && <div className="text-xs font-semibold text-white">{title}</div>}
              <p className="text-xs leading-relaxed">{message}</p>
            </div>
            {onClose && (
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                className="rounded p-0.5 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
