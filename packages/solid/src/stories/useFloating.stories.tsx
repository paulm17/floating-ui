import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/solid";
import { createEffect, createMemo, createSignal, JSX } from "solid-js";

export default { title: 'Solid: useFloating' };

export function UseFloating() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [arrowRef, setArrowRef] = createSignal(null);

  const floating = useFloating({
    open: isOpen,
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

  const arrowStyle = createMemo(() => {
    const arrowData = floating.middlewareData.arrow;
    const sides = {
      top: "bottom",
      right: "left", 
      bottom: "top",
      left: "right",
    };
    
    const side = sides[floating.placement.split("-")[0] as keyof typeof sides];
    const style: JSX.CSSProperties = {
      position: "absolute",
      left: arrowData?.x != null ? `${arrowData?.x}px` : undefined,
      top: arrowData?.y != null ? `${arrowData?.y}px` : undefined,
    };
    
    (style as any)[side] = "-4px";
    return style;
  });

  return (
    <div class="p-24 font-sans">
      <div class="space-y-8">
        <h1 class="text-3xl font-bold text-gray-800">
          Floating UI Test with Tailwind
        </h1>
        
        <div class="flex gap-4">
          <button
            ref={floating.refs.setReference}
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
            ref={floating.refs.setFloating}
            style={{
              ...floating.floatingStyles(),
              zIndex: 1000,
            }}
            class="bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-600 max-w-xs"
          >
            <div class="text-sm">
              This is a floating tooltip! 🎉
              <br />
              Current placement: <strong class="text-blue-300">{floating.placement}</strong>
            </div>
            
            {/* Arrow */}
            <div
              ref={setArrowRef}
              style={arrowStyle()}
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