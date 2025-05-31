import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  useTransitionStyles,
  useTransitionStatus,
} from '@floating-ui/react';

export default { title: 'React: UseTransition' };

export function UseTransition() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, {
    role: "tooltip",
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 300,
    initial: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    open: {
      opacity: 1,
      transform: 'scale(1)',
    },
    close: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
  });

  const { status } = useTransitionStatus(context, {
    duration: 300,
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Floating UI Transition Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Example 1: Button with Tooltip */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Hover/Focus Tooltip
            </h2>
            <div className="flex justify-center">
              <button
                ref={refs.setReference}
                {...getReferenceProps()}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Hover or Focus Me
              </button>
            </div>
            
            {isMounted && (
              <FloatingPortal>
                <div
                    ref={refs.setFloating}
                    style={floatingStyles}
                    {...getFloatingProps()}
                    >
                    <div
                        style={styles}
                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50"
                    >
                        <div className="flex items-center space-x-2">
                            <span>✨</span>
                            <span>This is a tooltip with transition!</span>
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                            Status: {status}
                        </div>
                    </div>
                </div>
              </FloatingPortal>
            )}
          </div>

          {/* Example 2: Click Popover */}
          <ClickPopoverExample />
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Transition Details
          </h2>
          <div className="space-y-2 text-gray-600">
            <p><strong>useTransitionStatus:</strong> Provides transition state management</p>
            <p><strong>useTransitionStyles:</strong> Handles CSS transitions for smooth animations</p>
            <p><strong>Duration:</strong> 300ms for smooth fade and scale effects</p>
            <p><strong>Effects:</strong> Opacity fade + scale transform</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClickPopoverExample() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 10 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  const { isMounted, styles } = useTransitionStyles(context, {
    duration: 250,
    initial: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    open: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    close: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
  });

  const { status } = useTransitionStatus(context, {
    duration: 250,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Hover Popover
      </h2>
      <div className="flex justify-center">
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200"
        >
          Hover for Popover
        </div>
      </div>

      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            >
            <div
                style={styles}
                className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50"
            >
                <div className="flex items-center space-x-2">
                    <span>✨</span>
                    <span>This is a tooltip with transition!</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                    Status: {status}
                </div>
            </div>
        </div>
        </FloatingPortal>
      )}
    </div>
  );
}