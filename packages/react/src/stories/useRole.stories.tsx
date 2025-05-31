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
  useRole as useReactRole,
  useInteractions,
  FloatingPortal
} from '@floating-ui/react';

export default { title: 'React: UseRole' };

export function UseRole() {
    const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useReactRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Floating UI useRole Hook Test
          </h1>
          <p className="text-gray-600 mb-8">
            Hover over or focus on the button below to see the tooltip with proper ARIA roles
          </p>
        </div>

        <div className="flex justify-center">
          <button
            ref={refs.setReference}
            {...getReferenceProps()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Hover me for tooltip
          </button>

          {isOpen && (
            <FloatingPortal>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs z-50"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>
                    This tooltip has the proper ARIA role="tooltip" applied via useRole hook!
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-300">
                  Check the DOM to see the role attribute
                </div>
              </div>
            </FloatingPortal>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            What's happening:
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>The useRole hook automatically applies role="tooltip" to the floating element</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>It also sets up proper ARIA attributes for accessibility</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>The tooltip appears on hover and focus, and dismisses properly</span>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Screen readers will announce this as a tooltip element</span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-amber-400 rounded-full mr-3 flex-shrink-0"></div>
            <div>
              <p className="text-amber-800 font-medium">Note:</p>
              <p className="text-amber-700 text-sm mt-1">
                Open your browser's developer tools and inspect the tooltip when it's visible to see the role="tooltip" attribute in action!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
