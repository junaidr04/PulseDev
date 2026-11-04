import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  triggerRef?: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  open,
  onClose,
  children,
  label,
  containerRef,
  triggerRef,
  initialFocusRef,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const containerRefRef = useRef(containerRef);
  const triggerRefRef = useRef(triggerRef);
  const initialFocusRefRef = useRef(initialFocusRef);
  const reducedMotion = useReducedMotion();
  onCloseRef.current = onClose;
  containerRefRef.current = containerRef;
  triggerRefRef.current = triggerRef;
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) triggerRefRef.current?.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRefRef.current?.current;
      if (target?.isConnected && target.offsetParent !== null) {
        target.focus();
        return;
      }
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !containerRefRef.current?.current?.contains(target)
      ) {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  const duration = reducedMotion ? 0 : 0.16;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.98, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration, ease: 'easeOut' }}
          className={`z-50 ${className}`}
        >
          {children}
          <button
            type="button"
            aria-label={`Close ${label}`}
            onClick={onClose}
            className="absolute right-2 top-2 z-10 rounded-md p-1 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Popover;
