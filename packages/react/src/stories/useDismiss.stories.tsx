import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss as useReactDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/react';

export default { title: 'React: useDismiss' };

export function useDismiss() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissCount, setDismissCount] = useState(0);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (!open) {
        setDismissCount(prev => prev + 1);
      }
    },
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useReactDismiss(context, {
    enabled: true,
    escapeKey: true,
    referencePress: false,
    referencePressEvent: 'pointerdown',
    outsidePress: true,
    outsidePressEvent: 'pointerdown',
    ancestorScroll: true,
    bubbles: true,
  });

  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">useDismiss Hook Test</h1>
        <p className="text-gray-600 mb-4">
          This tests the useDismiss hook functionality. The floating element should dismiss when:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Clicking outside the floating element</li>
          <li>Pressing the Escape key</li>
          <li>Scrolling (if ancestor scroll is enabled)</li>
        </ul>
        <p className="text-sm text-blue-600">
          Dismiss count: <span className="font-semibold">{dismissCount}</span>
        </p>
      </div>

      <div className="space-y-4">
        <button
          ref={refs.setReference}
          {...getReferenceProps()}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isOpen ? 'Close Floating Element' : 'Open Floating Element'}
        </button>

        {isOpen && (
          <FloatingPortal>
            <FloatingFocusManager context={context} modal={false}>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-50"
              >
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Floating Element</h3>
                  <p className="text-sm text-gray-600">
                    This element will dismiss when you:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Click outside this element</li>
                    <li>• Press the Escape key</li>
                    <li>• Scroll the page</li>
                  </ul>
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      Close manually
                    </button>
                  </div>
                </div>
              </div>
            </FloatingFocusManager>
          </FloatingPortal>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">useDismiss Configuration:</h3>
        <pre className="text-xs text-gray-700 overflow-x-auto">
{`useDismiss(context, {
  enabled: true,
  escapeKey: true,
  referencePress: false,
  outsidePress: true,
  ancestorScroll: true,
  bubbles: true,
})`}
        </pre>
      </div>

      {/* Extra content to test scrolling */}
      <div className="mt-12 space-y-4">
        <h3 className="font-semibold">Extra Content for Scroll Testing</h3>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded">
            <p>Content block {i + 1} - Scroll while the floating element is open to test ancestorScroll dismiss.</p>
          </div>
        ))}
      </div>
    </div>
  );
}