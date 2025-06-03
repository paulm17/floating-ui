import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick as useSolidClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  useHover
} from '@floating-ui/solid';
import { createEffect, createSignal } from 'solid-js';

export default { title: 'Solid: useClick' };

export function UseClick() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isTooltipOpen, setIsTooltipOpen] = createSignal(false);
  
  // Main click-triggered floating element
  const clickFloating = useFloating({
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

  const click = useSolidClick(clickFloating.context);
  const dismiss = useDismiss(clickFloating.context);
  const role = useRole(clickFloating.context);

  const clickInteractions = useInteractions([
    click,
    dismiss,
    role,
  ]);

  // Hover-triggered tooltip for comparison
  const hoverFloating = useFloating({
    open: () => isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    middleware: [
      offset(5),
      flip(),
      shift({ padding: 5 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(hoverFloating.context);
  const tooltipDismiss = useDismiss(hoverFloating.context);
  const tooltipRole = useRole(hoverFloating.context, { role: 'tooltip' });

  const hoverInteractions = useInteractions([
    hover,
    tooltipDismiss,
    tooltipRole,
  ]);

  return (
    <div class="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div class="max-w-2xl mx-auto space-y-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">
          Floating UI React Test
        </h1>

        {/* Click-triggered floating element */}
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-gray-800">
            useClick Hook Example
          </h2>
          <p class="text-gray-600">
            Click the button below to toggle a floating panel:
          </p>
          
          <div class="flex justify-center">
            <button
              ref={clickFloating.refs.setReference}
              {...clickInteractions.getReferenceProps()}
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isOpen() ? 'Close Panel' : 'Open Panel'}
            </button>
          </div>

          {isOpen() && (
            <FloatingPortal>
              <div
                ref={clickFloating.refs.setFloating}
                style={clickFloating.floatingStyles()}
                {...clickInteractions.getFloatingProps()}
                class="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50"
              >
                <div class="space-y-3">
                  <h3 class="font-semibold text-gray-900">
                    Floating Panel
                  </h3>
                  <p class="text-gray-600 text-sm">
                    This panel was triggered by clicking the button. It automatically positions itself to avoid going off-screen and can be dismissed by clicking outside or pressing Escape.
                  </p>
                  <div class="flex space-x-2">
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Click triggered
                    </span>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Auto-positioned
                    </span>
                  </div>
                </div>
              </div>
            </FloatingPortal>
          )}
        </div>

        {/* Hover-triggered tooltip for comparison */}
        <div class="space-y-4 border-t pt-8">
          <h2 class="text-xl font-semibold text-gray-800">
            useHover Hook Example (for comparison)
          </h2>
          <p class="text-gray-600">
            Hover over the button below to see a tooltip:
          </p>
          
          <div class="flex justify-center">
            <button
              ref={hoverFloating.refs.setReference}
              {...hoverInteractions.getReferenceProps()}
              class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Hover for Tooltip
            </button>
          </div>

          {isTooltipOpen() && (
            <FloatingPortal>
              <div
                ref={hoverFloating.refs.setFloating}
                style={hoverFloating.floatingStyles()}
                {...hoverInteractions.getFloatingProps()}
                class="bg-gray-900 text-white text-sm rounded px-3 py-2 shadow-lg z-50"
              >
                This is a hover-triggered tooltip
              </div>
            </FloatingPortal>
          )}
        </div>

        {/* Instructions */}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-2">
            Test Instructions:
          </h3>
          <ul class="text-blue-800 text-sm space-y-1">
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