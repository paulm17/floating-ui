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
  FloatingPortal,
  arrow,
  useHover
} from '@floating-ui/react';

export default { title: 'React: useClick' };

export function UseClick() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  
  // Main click-triggered floating element
  const {
    refs,
    floatingStyles,
    context,
  } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift({ padding: 5 }),
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

  // Hover-triggered tooltip for comparison
  const {
    refs: tooltipRefs,
    floatingStyles: tooltipFloatingStyles,
    context: tooltipContext,
  } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    middleware: [
      offset(5),
      flip(),
      shift({ padding: 5 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(tooltipContext);
  const tooltipDismiss = useDismiss(tooltipContext);
  const tooltipRole = useRole(tooltipContext, { role: 'tooltip' });

  const { getReferenceProps: getTooltipReferenceProps, getFloatingProps: getTooltipFloatingProps } = useInteractions([
    hover,
    tooltipDismiss,
    tooltipRole,
  ]);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Floating UI React Test
        </h1>

        {/* Click-triggered floating element */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            useClick Hook Example
          </h2>
          <p className="text-gray-600">
            Click the button below to toggle a floating panel:
          </p>
          
          <div className="flex justify-center">
            <button
              ref={refs.setReference}
              {...getReferenceProps()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {/* {isOpen ? 'Close Panel' : 'Open Panel'} */}
              hello
            </button>
          </div>

          {isOpen && (
            <FloatingPortal>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
                className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50"
              >
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Floating Panel
                  </h3>
                  <p className="text-gray-600 text-sm">
                    This panel was triggered by clicking the button. It automatically positions itself to avoid going off-screen and can be dismissed by clicking outside or pressing Escape.
                  </p>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Click triggered
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Auto-positioned
                    </span>
                  </div>
                </div>
              </div>
            </FloatingPortal>
          )}
        </div>

        {/* Hover-triggered tooltip for comparison */}
        <div className="space-y-4 border-t pt-8">
          <h2 className="text-xl font-semibold text-gray-800">
            useHover Hook Example (for comparison)
          </h2>
          <p className="text-gray-600">
            Hover over the button below to see a tooltip:
          </p>
          
          <div className="flex justify-center">
            <button
              ref={tooltipRefs.setReference}
              {...getTooltipReferenceProps()}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Hover for Tooltip
            </button>
          </div>

          {isTooltipOpen && (
            <FloatingPortal>
              <div
                ref={tooltipRefs.setFloating}
                style={tooltipFloatingStyles}
                {...getTooltipFloatingProps()}
                className="bg-gray-900 text-white text-sm rounded px-3 py-2 shadow-lg z-50"
              >
                This is a hover-triggered tooltip
              </div>
            </FloatingPortal>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Test Instructions:
          </h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Click the blue button to open/close the floating panel</li>
            <li>• Try clicking outside the panel to dismiss it</li>
            <li>• Press Escape key to close the panel</li>
            <li>• Resize the window to see automatic repositioning</li>
            <li>• Hover over the green button to see the tooltip</li>
          </ul>
        </div>
      </div>
    </div>
  );
}