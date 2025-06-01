import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover as useSolidHover,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: useHover' };

export function useHover() {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: "start" }),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useSolidHover(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: "tooltip" });

  const interactions = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <div class="p-8 bg-gray-50 min-h-screen">
      <div class="max-w-2xl mx-auto space-y-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">
          Floating UI Hover Test
        </h1>
        
        <div class="space-y-6">
          <div class="flex items-center gap-4">
            <button
              ref={floating.refs.setReference}
              {...interactions.getReferenceProps()}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Hover me for tooltip
            </button>
            
            {isOpen() && (
              <FloatingPortal>
                <div
                  ref={floating.refs.setFloating}
                  style={floating.floatingStyles()}
                  {...interactions.getFloatingProps()}
                  class="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50 max-w-xs"
                >
                  This is a floating tooltip that appears on hover! It automatically positions itself and adjusts if there's not enough space.
                </div>
              </FloatingPortal>
            )}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HoverCard 
              title="Feature A"
              description="This card shows how floating tooltips work with different trigger elements."
              tooltipText="Feature A provides advanced functionality with real-time updates and seamless integration."
            />
            
            <HoverCard 
              title="Feature B" 
              description="Another example of hover interactions with floating UI positioning."
              tooltipText="Feature B offers powerful analytics and detailed reporting capabilities."
            />
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm border">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              Test Instructions
            </h3>
            <ul class="text-gray-600 space-y-1 text-sm">
              <li>• Hover over the blue button to see the tooltip</li>
              <li>• Try hovering over the cards below</li>
              <li>• Notice how tooltips automatically position themselves</li>
              <li>• Move your mouse away to dismiss the tooltips</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface hoverCardProps {
  title: string;
  description: string;
  tooltipText: string;
}

function HoverCard({ title, description, tooltipText }: hoverCardProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useSolidHover(floating.context, {
    delay: { open: 200, close: 0 }
  });
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: "tooltip" });

  const interactions = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        ref={floating.refs.setReference}
        {...interactions.getReferenceProps()}
        class="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 cursor-pointer"
      >
        <h4 class="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
        <p class="text-gray-600 text-sm">{description}</p>
      </div>

      {isOpen() && (
        <FloatingPortal>
          <div
            ref={floating.refs.setFloating}
            style={floating.floatingStyles()}
            {...interactions.getFloatingProps()}
            class="bg-indigo-900 text-white px-4 py-3 rounded-lg text-sm shadow-xl z-50 max-w-sm border border-indigo-700"
          >
            <div class="font-medium mb-1">{title} Details</div>
            <div class="text-indigo-100">{tooltipText}</div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}