import React, { useState } from 'react';
import {
  useFloating,
  useClientPoint as useReactClientPoint,
  useInteractions,
  useHover,
  useDismiss,
  FloatingPortal
} from '@floating-ui/react';

export default { title: 'React: useClientPoint' };

export function useClientPoint() {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: []
  });

  const clientPoint = useReactClientPoint(context);
  
  const hover = useHover(context, {
    move: false
  });
  
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    clientPoint,
    hover,
    dismiss
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Floating UI useClientPoint Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Instructions:
          </h2>
          <p className="text-gray-600 mb-4">
            Move your mouse over the trigger area below. A tooltip will follow your cursor position!
          </p>
        </div>

        <div 
          ref={refs.setReference}
          {...getReferenceProps()}
          className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <div className="space-y-4">
            <div className="text-6xl">🎯</div>
            <h3 className="text-2xl font-semibold text-gray-700">
              Hover Zone
            </h3>
            <p className="text-gray-500">
              Move your mouse around this area to see the floating tooltip follow your cursor
            </p>
          </div>
        </div>

        {isOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-50 pointer-events-none"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Following your cursor!</span>
              </div>
            </div>
          </FloatingPortal>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            About this demo:
          </h3>
          <ul className="text-gray-600 space-y-2">
            <li>• Uses <code className="bg-gray-100 px-2 py-1 rounded">useClientPoint</code> to track mouse position</li>
            <li>• Combines with <code className="bg-gray-100 px-2 py-1 rounded">useHover</code> for mouse enter/leave detection</li>
            <li>• <code className="bg-gray-100 px-2 py-1 rounded">useDismiss</code> handles closing when pressing Escape</li>
            <li>• Tooltip is rendered in a portal to avoid z-index issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}