import React, { useState } from 'react';
import { FloatingOverlay as ReactFloatingOverlay, FloatingFocusManager, useFloating, autoUpdate, useClick, useDismiss, useRole, useInteractions } from '@floating-ui/react';

export default { title: 'React: FloatingOverlay' };

export function FloatingOverlay() {
    const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          FloatingUI Overlay Test
        </h1>
        
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Open Overlay
        </button>

        {isOpen && (
          <ReactFloatingOverlay className="bg-black bg-opacity-50 flex items-center justify-center">
            <FloatingFocusManager context={context}>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-200 scale-100"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Modal Content
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This is a floating overlay using @floating-ui/react! 
                    Click outside or press Escape to close.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </FloatingFocusManager>
          </ReactFloatingOverlay>
        )}
      </div>
    </div>
  );
}