import { 
  FloatingOverlay as SolidFloatingOverlay, 
  FloatingFocusManager, useFloating, 
  autoUpdate, useClick, useDismiss, 
  useRole, 
  useInteractions 
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: FloatingOverlay' };

export function FloatingOverlay() {
    const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context);

  const interactions = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">
          FloatingUI Overlay Test
        </h1>
        
        <button
          ref={floating.refs.setReference}
          {...interactions.getReferenceProps()}
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Open Overlay
        </button>

        {isOpen() && (
          <SolidFloatingOverlay class="bg-black bg-opacity-50 flex items-center justify-center">
            <FloatingFocusManager context={floating.context}>
              <div
                ref={floating.refs.setFloating}
                style={floating.floatingStyles()}
                {...interactions.getFloatingProps()}
                class="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-200 scale-100"
              >
                <div class="text-center">
                  <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    Modal Content
                  </h2>
                  <p class="text-gray-600 mb-6">
                    This is a floating overlay using @floating-ui/react! 
                    Click outside or press Escape to close.
                  </p>
                  <div class="flex gap-3 justify-center">
                    <button
                      onClick={() => setIsOpen(false)}
                      class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            </FloatingFocusManager>
          </SolidFloatingOverlay>
        )}
      </div>
    </div>
  );
}