import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  useTransitionStyles,
  useTransitionStatus,
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: UseTransition' };

export function UseTransition() {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(floating.context, { move: false });
  const focus = useFocus(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, {
    role: "tooltip",
  });

  const interactions = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const transitionStyles = useTransitionStyles(floating.context, {
    duration: 300,
    initial: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    open: {
      opacity: 1,
      transform: 'scale(1)',
    },
    close: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
  });

  const transitionStatus = useTransitionStatus(floating.context, {
    duration: 300,
  });

  return (
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8 text-center">
          Floating UI Transition Test
        </h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Example 1: Button with Tooltip */}
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">
              Hover/Focus Tooltip
            </h2>
            <div class="flex justify-center">
              <button
                ref={floating.refs.setReference}
                {...interactions.getReferenceProps()}
                class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Hover or Focus Me
              </button>
            </div>
            
            {transitionStyles.isMounted && (
              <FloatingPortal>
                <div
                    ref={floating.refs.setFloating}
                    style={floating.floatingStyles()}
                    {...interactions.getFloatingProps()}
                    >
                    <div
                        style={transitionStyles.styles}
                        class="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50"
                    >
                        <div class="flex items-center space-x-2">
                            <span>✨</span>
                            <span>This is a tooltip with transition!</span>
                        </div>
                        <div class="text-xs opacity-75 mt-1">
                            Status: {transitionStatus.status}
                        </div>
                    </div>
                </div>
              </FloatingPortal>
            )}
          </div>

          {/* Example 2: Click Popover */}
          <ClickPopoverExample />
        </div>

        {/* Info Section */}
        <div class="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4 text-gray-800">
            Transition Details
          </h2>
          <div class="space-y-2 text-gray-600">
            <p><strong>useTransitionStatus:</strong> Provides transition state management</p>
            <p><strong>useTransitionStyles:</strong> Handles CSS transitions for smooth animations</p>
            <p><strong>Duration:</strong> 300ms for smooth fade and scale effects</p>
            <p><strong>Effects:</strong> Opacity fade + scale transform</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClickPopoverExample() {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 10 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context);

  const interactions = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  const transitionStyles = useTransitionStyles(floating.context, {
    duration: 250,
    initial: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
    open: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
    close: {
      opacity: 0,
      transform: 'translateY(-10px)',
    },
  });

  const transitionStatus = useTransitionStatus(floating.context, {
    duration: 250,
  });

  return (
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-800">
        Hover Popover
      </h2>
      <div class="flex justify-center">
        <div
          ref={floating.refs.setReference}
          {...interactions.getReferenceProps()}
          class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg cursor-pointer transition-colors duration-200"
        >
          Hover for Popover
        </div>
      </div>

      {transitionStyles.isMounted && (
        <FloatingPortal>
          <div
            ref={floating.refs.setFloating}
            style={floating.floatingStyles()}
            {...interactions.getFloatingProps()}
            >
            <div
                style={transitionStyles.styles}
                class="bg-gray-900 text-white px-3 py-2 rounded-md text-sm font-medium shadow-lg z-50"
            >
                <div class="flex items-center space-x-2">
                    <span>✨</span>
                    <span>This is a tooltip with transition!</span>
                </div>
                <div class="text-xs opacity-75 mt-1">
                    Status: {transitionStatus.status}
                </div>
            </div>
        </div>
        </FloatingPortal>
      )}
    </div>
  );
}