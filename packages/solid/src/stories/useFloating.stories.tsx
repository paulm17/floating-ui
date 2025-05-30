import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/solid";
import { createSignal } from "solid-js";
import styles from './styles.module.css';

export default { title: 'useFloating' };

export function UseFloating() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [arrowRef, setArrowRef] = createSignal(null);

  const { refs, floatingStyles, placement, middlewareData } = useFloating({
    open: () => isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift({ 'padding': '8px' }),
      arrow({ element: arrowRef() }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "top",
  });

  // Arrow positioning
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placement.split("-")[0]];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Floating UI Test with CSS Modules
        </h1>
        
        <div className={styles.buttonGroup}>
          <button
            ref={refs.setReference}
            onClick={() => setIsOpen(!isOpen())}
            className={styles.primaryButton}
          >
            Toggle Tooltip
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className={styles.secondaryButton}
          >
            Close
          </button>
        </div>

        {isOpen() && (
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 1000,
            }}
            className={styles.tooltip}
          >
            <div className={styles.tooltipText}>
              This is a floating tooltip! 🎉
              <br />
              Current placement: <strong className={styles.placement}>{placement}</strong>
            </div>
            
            {/* Arrow */}
            <div
              ref={setArrowRef}
              style={{
                position: 'absolute',
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                [staticSide]: '-4px',
              }}
              className={styles.arrow}
            />
          </div>
        )}

        <div className={styles.infoBox}>
          <div className={styles.infoContent}>
            <h3 className={styles.infoTitle}>Features demonstrated:</h3>
            <div className={styles.infoText}>
              • useFloating hook with auto-update<br />
              • Offset, flip, and shift middleware<br />
              • Arrow positioning<br />
              • CSS Modules for styling<br />
              • Dynamic placement detection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}