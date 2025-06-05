import React, { useState } from 'react';
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
  FloatingDelayGroup as ReactFloatingDelayGroup,
  useDelayGroup,
  useDelayGroupContext
} from '@floating-ui/react';

export default { title: 'React: FloatingDelayGroup' };

export function FloatingDelayGroup() {
    return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        FloatingDelayGroup Test
      </h1>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          Hover over the buttons below. Notice how after hovering on one button, 
          the subsequent tooltips appear immediately without delay when you move 
          between them quickly.
        </p>
        
        <ReactFloatingDelayGroup delay={{ open: 1000, close: 200 }}>
          <div className="flex flex-wrap gap-4">
            <Tooltip content="This is the first tooltip with some helpful information">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Hover me first
              </button>
            </Tooltip>
            
            <Tooltip content="Second tooltip appears faster after the first one">
              <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Then hover me
              </button>
            </Tooltip>
            
            <Tooltip content="Third tooltip also benefits from the delay group">
              <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                And me too
              </button>
            </Tooltip>
            
            <Tooltip content="All tooltips in this group share the same delay behavior">
              <button className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Finally me
              </button>
            </Tooltip>
          </div>
          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Comparison: Tooltips Outside Delay Group
            </h2>
            <p className="text-gray-600">
              These tooltips below are not in a delay group, so each one has the full delay:
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Tooltip content="This tooltip always has the full delay" useDelayGroup={false}>
                <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Independent tooltip 1
                </button>
              </Tooltip>
              
              <Tooltip content="This one also has the full delay every time" useDelayGroup={false}>
                <button className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Independent tooltip 2
                </button>
              </Tooltip>
            </div>
          </div>
        </ReactFloatingDelayGroup>
      </div>      
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• The FloatingDelayGroup coordinates timing across multiple floating elements</li>
          <li>• First hover has a 1000ms delay to open</li>
          <li>• Subsequent hovers within the group open immediately</li>
          <li>• After 200ms of not hovering any element, the group resets</li>
          <li>• Each tooltip uses useDelayGroup() to participate in the group</li>
        </ul>
      </div>
    </div>
  );
}

function Tooltip({ children, content, useDelayGroup: shouldUseDelayGroup = true }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const groupContext = shouldUseDelayGroup ? useDelayGroup(context, { id: content }) : null;
  const delay = groupContext?.delay || { open: 1000, close: 200 };

  const hover = useHover(context, {
    move: false,
    delay: delay,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="inline-block"
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="bg-gray-900 text-white px-2 py-1 rounded text-sm max-w-xs z-50 shadow-lg"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}