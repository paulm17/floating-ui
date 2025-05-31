import React, { useState } from 'react';
import {
  FloatingTree as ReactFloatingTree,
  FloatingNode,
  FloatingPortal,
  useFloating,
  useInteractions,
  useHover,
  useDismiss,
  useRole,
  FloatingFocusManager,
  offset,
  flip,
  shift,
  autoUpdate,
  safePolygon
} from '@floating-ui/react';

export default { title: 'React: FloatingTree' };

export function FloatingTree() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">FloatingTree Test</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Nested Menu Example</h2>
          <p className="text-gray-600 mb-6">
            Hover over the menu button to see a dropdown with nested submenus. 
            The FloatingTree manages the hierarchy and ensures proper focus management.
          </p>
          
          <ReactFloatingTree>
            <div className="flex gap-4">
              <Menu 
                isOpen={isMenuOpen} 
                setIsOpen={setIsMenuOpen} 
                nodeId="main-menu" 
              />
            </div>
          </ReactFloatingTree>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Features Demonstrated:</h3>
          <ul className="text-gray-600 space-y-2">
            <li>• <strong>FloatingTree:</strong> Manages the hierarchy of nested floating elements</li>
            <li>• <strong>FloatingNode:</strong> Each menu item is a node in the tree structure</li>
            <li>• <strong>Hover interactions:</strong> Menus open on hover with safe polygon navigation</li>
            <li>• <strong>Keyboard navigation:</strong> Full accessibility support with focus management</li>
            <li>• <strong>Auto-positioning:</strong> Submenus automatically position to avoid viewport edges</li>
            <li>• <strong>Portal rendering:</strong> Floating elements render outside normal DOM flow</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const MenuItem = ({ label, children, nodeId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    handleClose: safePolygon({
      buffer: 8,
      blockPointerEvents: true,    // ← must be true so the “triangle” blocks pointer events
    }),
    delay: { open: 150, close: 500 },
    restMs: 50,                    // ← give the submenu time to mount
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <FloatingNode id={nodeId}>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex items-center justify-between text-gray-700 transition-colors"
      >
        <span>{label}</span>
        {children && <span className="text-gray-400">→</span>}
      </div>
      
      {isOpen && children && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50"
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  );
};

const Menu = ({ isOpen, setIsOpen, nodeId }) => {
  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    handleClose: safePolygon({
      buffer: 8,
      blockPointerEvents: true,    // ← again: must be true at the root level
    }),
    delay: { open: 150, close: 500 },
    restMs: 50,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'menu' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <FloatingNode id={nodeId}>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
      >
        Menu with Submenus
      </button>
      
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[220px] z-40"
            >
              <MenuItem label="File" nodeId="file">
                <MenuItem label="New" nodeId="new">
                  <MenuItem label="Document" nodeId="document" />
                  <MenuItem label="Spreadsheet" nodeId="spreadsheet" />
                  <MenuItem label="Presentation" nodeId="presentation" />
                </MenuItem>
                <MenuItem label="Open" nodeId="open" />
                <MenuItem label="Save" nodeId="save" />
                <div className="border-t border-gray-200 my-1" />
                <MenuItem label="Exit" nodeId="exit" />
              </MenuItem>
              
              <MenuItem label="Edit" nodeId="edit">
                <MenuItem label="Undo" nodeId="undo" />
                <MenuItem label="Redo" nodeId="redo" />
                <div className="border-t border-gray-200 my-1" />
                <MenuItem label="Cut" nodeId="cut" />
                <MenuItem label="Copy" nodeId="copy" />
                <MenuItem label="Paste" nodeId="paste" />
              </MenuItem>
              
              <MenuItem label="View" nodeId="view">
                <MenuItem label="Zoom" nodeId="zoom">
                  <MenuItem label="Zoom In" nodeId="zoom-in" />
                  <MenuItem label="Zoom Out" nodeId="zoom-out" />
                  <MenuItem label="Fit to Window" nodeId="fit-window" />
                </MenuItem>
                <MenuItem label="Layout" nodeId="layout">
                  <MenuItem label="Grid View" nodeId="grid" />
                  <MenuItem label="List View" nodeId="list" />
                  <MenuItem label="Card View" nodeId="card" />
                </MenuItem>
                <MenuItem label="Full Screen" nodeId="fullscreen" />
              </MenuItem>
              
              <div className="border-t border-gray-200 my-1" />
              <MenuItem label="Settings" nodeId="settings" />
              <MenuItem label="Help" nodeId="help" />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  );
};
