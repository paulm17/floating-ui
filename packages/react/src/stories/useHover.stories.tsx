import React, { useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover as useReactHover,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal
} from '@floating-ui/react';

export default { title: 'React: useHover' };

export function useHover() {
  const [isOpen, setIsOpen] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: "start" }),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useReactHover(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Floating UI Hover Test
        </h1>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              ref={refs.setReference}
              {...getReferenceProps()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Hover me for tooltip
            </button>
            
            {isOpen && (
              <FloatingPortal>
                <div
                  ref={refs.setFloating}
                  style={floatingStyles}
                  {...getFloatingProps()}
                  className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg z-50 max-w-xs"
                >
                  This is a floating tooltip that appears on hover! It automatically positions itself and adjusts if there's not enough space.
                </div>
              </FloatingPortal>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Instructions
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
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
  const [isOpen, setIsOpen] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useReactHover(context, {
    delay: { open: 200, close: 0 }
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 cursor-pointer"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-indigo-900 text-white px-4 py-3 rounded-lg text-sm shadow-xl z-50 max-w-sm border border-indigo-700"
          >
            <div className="font-medium mb-1">{title} Details</div>
            <div className="text-indigo-100">{tooltipText}</div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}