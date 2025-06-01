import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole as useSolidRole,
  useInteractions,
  FloatingPortal
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: UseRole' };

export function UseRole() {
    const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(floating.context);
  const focus = useFocus(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useSolidRole(floating.context, { role: 'tooltip' });

  const interactions = useInteractions([
    hover,
    focus,
    dismiss,
    role
  ]);

  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div class="max-w-2xl mx-auto space-y-8">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            Floating UI useRole Hook Test
          </h1>
          <p class="text-gray-600 mb-8">
            Hover over or focus on the button below to see the tooltip with proper ARIA roles
          </p>
        </div>

        <div class="flex justify-center">
          <button
            ref={floating.refs.setReference}
            {...interactions.getReferenceProps()}
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Hover me for tooltip
          </button>

          {isOpen() && (
            <FloatingPortal>
              <div
                ref={floating.refs.setFloating}
                style={floating.floatingStyles}
                {...interactions.getFloatingProps()}
                class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs z-50"
              >
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>
                    This tooltip has the proper ARIA role="tooltip" applied via useRole hook!
                  </span>
                </div>
                <div class="mt-2 text-xs text-gray-300">
                  Check the DOM to see the role attribute
                </div>
              </div>
            </FloatingPortal>
          )}
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            What's happening:
          </h2>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-start">
              <span class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>The useRole hook automatically applies role="tooltip" to the floating element</span>
            </li>
            <li class="flex items-start">
              <span class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>It also sets up proper ARIA attributes for accessibility</span>
            </li>
            <li class="flex items-start">
              <span class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>The tooltip appears on hover and focus, and dismisses properly</span>
            </li>
            <li class="flex items-start">
              <span class="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span>Screen readers will announce this as a tooltip element</span>
            </li>
          </ul>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="w-5 h-5 bg-amber-400 rounded-full mr-3 flex-shrink-0"></div>
            <div>
              <p class="text-amber-800 font-medium">Note:</p>
              <p class="text-amber-700 text-sm mt-1">
                Open your browser's developer tools and inspect the tooltip when it's visible to see the role="tooltip" attribute in action!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
