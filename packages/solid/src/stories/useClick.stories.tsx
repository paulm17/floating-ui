import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/solid";
import { createSignal } from "solid-js";

export default { title: 'Solid: useFloating' };

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
      arrow({ element: arrowRef }),
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
    <div class="p-24 font-sans">
      <div class="space-y-8">
        <h1 class="text-3xl font-bold text-gray-800">
          Floating UI Test with Tailwind
        </h1>
        
        <div class="flex gap-4">
          <button
            ref={refs.setReference}
            onClick={() => setIsOpen(!isOpen())}
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Toggle Tooltip
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

        {isOpen() && (
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles(),
              zIndex: 1000,
            }}
            class="bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-600 max-w-xs"
          >
            <div class="text-sm">
              This is a floating tooltip! 🎉
              <br />
              Current placement: <strong class="text-blue-300">{placement}</strong>
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
              class="w-2 h-2 bg-gray-800 border border-gray-600 rotate-45"
            />
          </div>
        )}

        <div class="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div class="space-y-2">
            <h3 class="font-semibold text-gray-800">Features demonstrated:</h3>
            <div class="text-sm text-gray-600 leading-relaxed">
              • useFloating hook with auto-update<br />
              • Offset, flip, and shift middleware<br />
              • Arrow positioning<br />
              • Tailwind CSS for styling<br />
              • Dynamic placement detection
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}