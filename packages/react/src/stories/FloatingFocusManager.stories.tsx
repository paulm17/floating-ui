import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager as ReactFloatingFocusManager,
  FloatingPortal
} from '@floating-ui/react';

export default { title: 'React: FloatingFocusManager' };

export function FloatingFocusManager() {
    const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          FloatingFocusManager Test
        </h1>
        
        <div className="space-y-6">
          <p className="text-gray-700">
            Click the button below to open a floating dialog with focus management.
            The FloatingFocusManager ensures proper focus handling within the floating element.
          </p>

          <button
            ref={refs.setReference}
            {...getReferenceProps()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Open Floating Dialog
          </button>

          {isOpen && (
            <FloatingPortal>
              <ReactFloatingFocusManager context={context} modal={false}>
                <div
                  ref={refs.setFloating}
                  style={floatingStyles}
                  {...getFloatingProps()}
                  className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm z-50"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Floating Dialog
                  </h2>
                  
                  <p className="text-gray-600 mb-4">
                    This dialog demonstrates FloatingFocusManager. Focus is trapped within this element.
                  </p>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="First input"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <input
                      type="text"
                      placeholder="Second input"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    <div className="flex gap-2 pt-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors">
                        Save
                      </button>
                      
                      <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </ReactFloatingFocusManager>
            </FloatingPortal>
          )}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Test Instructions
          </h3>
          <ul className="text-gray-600 space-y-2 text-sm">
            <li>• Click the button to open the floating dialog</li>
            <li>• Try tabbing through the inputs and buttons</li>
            <li>• Focus should stay trapped within the dialog</li>
            <li>• Press Escape or click Cancel to close</li>
            <li>• Focus should return to the trigger button when closed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}