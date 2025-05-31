import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useClick,
  useDismiss,
  useRole,
  useInteractions as useReactInteractions,
  FloatingPortal
} from '@floating-ui/react';

export default { title: 'React: UseInteractions' };

function TooltipButton() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift({ padding: 5 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useReactInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        Hover me for tooltip
      </button>
      
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50 max-w-xs"
          >
            This is a tooltip created with @floating-ui/react and useInteractions hook!
          </div>
        )}
      </FloatingPortal>
    </>
  );
}

export function UseInteractions() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          @floating-ui/react useInteractions Test
        </h1>
        
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Tooltip Example
            </h2>
            <p className="text-gray-600 mb-4">
              Hover over the button to see a tooltip with automatic positioning.
            </p>
            <TooltipButton />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Popover Example
            </h2>
            <p className="text-gray-600 mb-4">
              Click the button to open a popover. It will automatically position itself and can be dismissed by clicking outside or pressing escape.
            </p>
            <PopoverButton />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Multiple Triggers
            </h2>
            <p className="text-gray-600 mb-4">
              Test positioning with multiple elements to see how floating-ui handles collisions and repositioning.
            </p>
            <div className="flex flex-wrap gap-4">
              <TooltipButton />
              <PopoverButton />
              <TooltipButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopoverButton() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 10 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useReactInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      >
        Click me for popover
      </button>
      
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Popover Content</h3>
            <p className="text-gray-600 text-sm">
              This popover demonstrates click interactions with floating-ui. 
              Click outside or press escape to close.
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </FloatingPortal>
    </>
  );
}
