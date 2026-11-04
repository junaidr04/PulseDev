import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeDisabled?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modalStack: string[] = [];

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  closeOnBackdrop = true,
  closeDisabled = false,
  initialFocusRef,
  className = '',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const modalId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const initialFocusRefRef = useRef(initialFocusRef);
  const reducedMotion = useReducedMotion();
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!open) return;

    modalStack.push(modalId);
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusInitial = () => {
      const target = initialFocusRefRef.current?.current;
      if (target?.isConnected) {
        target.focus();
        return;
      }
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable || panelRef.current)?.focus();
    };

    const frame = window.requestAnimationFrame(focusInitial);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== modalId) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!closeDisabledRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const stackIndex = modalStack.lastIndexOf(modalId);
      if (stackIndex !== -1) modalStack.splice(stackIndex, 1);
      previousFocusRef.current?.focus();
    };
  }, [modalId, open]);

  const duration = reducedMotion ? 0 : 0.18;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeOut' }}
          onMouseDown={(event) => {
            if (
              modalStack[modalStack.length - 1] === modalId &&
              !closeDisabledRef.current &&
              closeOnBackdrop &&
              event.target === event.currentTarget
            ) {
              onClose();
            }
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration, ease: 'easeOut' }}
            className={`my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-white/[0.12] bg-[#11151f] p-5 shadow-xl shadow-black/20 outline-none sm:p-6 ${className}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.07] pb-3.5">
              <div>
                <h2 id={titleId} className="text-sm font-semibold text-white">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-xs text-neutral-400">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                disabled={closeDisabled}
                onClick={onClose}
                className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
