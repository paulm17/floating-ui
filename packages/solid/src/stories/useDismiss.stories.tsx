import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss as useSolidDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: useDismiss' };

export function useDismiss() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [dismissCount, setDismissCount] = createSignal(0);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setDismissCount(prev => prev + 1);
      }
    },
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useSolidDismiss(floating.context, {
    enabled: true,
    escapeKey: true,
    referencePress: false,
    referencePressEvent: 'pointerdown',
    outsidePress: true,
    outsidePressEvent: 'pointerdown',
    ancestorScroll: true,
    bubbles: true,
  });

  const role = useRole(floating.context);

  const interactions = useInteractions([
    dismiss,
    role,
  ]);

  return (
    <div class="p-8 max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-4">useDismiss Hook Test</h1>
        <p class="text-gray-600 mb-4">
          This tests the useDismiss hook functionality. The floating element should dismiss when:
        </p>
        <ul class="list-disc list-inside text-gray-600 space-y-1 mb-4">
          <li>Clicking outside the floating element</li>
          <li>Pressing the Escape key</li>
          <li>Scrolling (if ancestor scroll is enabled)</li>
        </ul>
        <p class="text-sm text-blue-600">
          Dismiss count: <span class="font-semibold">{dismissCount()}</span>
        </p>
      </div>

      <div class="space-y-4">
        <button
          ref={floating.refs.setReference}
          {...interactions.getReferenceProps()}
          onClick={() => setIsOpen(!isOpen())}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {isOpen() ? 'Close Floating Element' : 'Open Floating Element'}
        </button>

        {isOpen() && (
          <FloatingPortal>
            <FloatingFocusManager context={floating.context} modal={false}>
              <div
                ref={floating.refs.setFloating}
                style={floating.floatingStyles()}
                {...interactions.getFloatingProps()}
                class="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-50"
              >
                <div class="space-y-3">
                  <h3 class="font-semibold text-gray-900">Floating Element</h3>
                  <p class="text-sm text-gray-600">
                    This element will dismiss when you:
                  </p>
                  <ul class="text-xs text-gray-500 space-y-1">
                    <li>• Click outside this element</li>
                    <li>• Press the Escape key</li>
                    <li>• Scroll the page</li>
                  </ul>
                  <div class="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setIsOpen(false)}
                      class="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
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

      <div class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="font-semibold mb-2">useDismiss Configuration:</h3>
        <pre class="text-xs text-gray-700 overflow-x-auto">
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
      <div class="mt-12 space-y-4">
        <h3 class="font-semibold">Extra Content for Scroll Testing</h3>
        {Array.from({ length: 10 }, (_, i) => (
          <div class="p-4 bg-gray-100 rounded">
            <p>Content block {i + 1} - Scroll while the floating element is open to test ancestorScroll dismiss.</p>
          </div>
        ))}
      </div>
    </div>
  );
}