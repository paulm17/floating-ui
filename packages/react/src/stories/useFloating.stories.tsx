import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
} from "@floating-ui/react";
import { useRef, useState } from "react";

export default { title: 'React: useFloating' };

export function UseFloating() {
  const [isOpen, setIsOpen] = useState(false);
  const arrowRef = useRef(null);

  const { refs, floatingStyles, placement, middlewareData } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 }),
      arrow({ element: arrowRef.current }),
    ],
    whileElementsMounted: autoUpdate,
    placement: "top",
  });  

  // Arrow positioning
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  // Determine which side is “static” (where the arrow base should sit)
  const staticSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[placement.split("-")[0] as "top" | "right" | "bottom" | "left"];

  // Build a CSSProperties object for the arrow, then inject [staticSide]:
  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    left:     arrowX != null ? `${arrowX}px` : undefined,
    top:      arrowY != null ? `${arrowY}px` : undefined,
    // We can’t directly write [staticSide] here because TS won’t allow it in JSX
  };
  // Assign the dynamic property (e.g. “bottom: -4px” or “left: -4px”)
  (arrowStyle as any)[staticSide] = "-4px";

  return (
    <div className="p-24 font-sans">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Floating UI Test with Tailwind
        </h1>
        
        <div className="flex gap-4">
          <button
            ref={refs.setReference}
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Toggle Tooltip
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

        {isOpen && (
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 1000,
            }}
            className="bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-600 max-w-xs"
          >
            <div className="text-sm">
              This is a floating tooltip! 🎉
              <br />
              Current placement: <strong className="text-blue-300">{placement}</strong>
            </div>
            
            {/* Arrow */}
            <div
              ref={arrowRef}
              style={arrowStyle}
              className="w-2 h-2 bg-gray-800 border border-gray-600 rotate-45"
            />
          </div>
        )}

        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">Features demonstrated:</h3>
            <div className="text-sm text-gray-600 leading-relaxed">
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