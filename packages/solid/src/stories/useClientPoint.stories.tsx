import {
  useFloating,
  useClientPoint as useSolidClientPoint,
  useInteractions,
  useHover,
  useDismiss,
  FloatingPortal
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: useClientPoint' };

export function useClientPoint() {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: []
  });

  const clientPoint = useSolidClientPoint(floating.context);
  
  const hover = useHover(floating.context, {
    move: false
  });
  
  const dismiss = useDismiss(floating.context);

  const interactions = useInteractions([
    clientPoint,
    hover,
    dismiss
  ]);

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">
          Floating UI useClientPoint Test
        </h1>
        
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 class="text-xl font-semibold text-gray-700 mb-4">
            Instructions:
          </h2>
          <p class="text-gray-600 mb-4">
            Move your mouse over the trigger area below. A tooltip will follow your cursor position!
          </p>
        </div>

        <div 
          ref={floating.refs.setReference}
          {...interactions.getReferenceProps()}
          class="bg-white border-2 border-dashed border-blue-300 rounded-lg p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <div class="space-y-4">
            <div class="text-6xl">🎯</div>
            <h3 class="text-2xl font-semibold text-gray-700">
              Hover Zone
            </h3>
            <p class="text-gray-500">
              Move your mouse around this area to see the floating tooltip follow your cursor
            </p>
          </div>
        </div>

        {isOpen() && (
          <FloatingPortal>
            <div
              ref={floating.refs.setFloating}
              style={floating.floatingStyles()}
              {...interactions.getFloatingProps()}
              class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-50 pointer-events-none"
            >
              <div class="flex items-center space-x-2">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Following your cursor!</span>
              </div>
            </div>
          </FloatingPortal>
        )}

        <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-3">
            About this demo:
          </h3>
          <ul class="text-gray-600 space-y-2">
            <li>• Uses <code class="bg-gray-100 px-2 py-1 rounded">useClientPoint</code> to track mouse position</li>
            <li>• Combines with <code class="bg-gray-100 px-2 py-1 rounded">useHover</code> for mouse enter/leave detection</li>
            <li>• <code class="bg-gray-100 px-2 py-1 rounded">useDismiss</code> handles closing when pressing Escape</li>
            <li>• Tooltip is rendered in a portal to avoid z-index issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
