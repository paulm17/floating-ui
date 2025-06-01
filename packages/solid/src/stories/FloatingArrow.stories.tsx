// import React, { useState, useRef, ReactElement, isValidElement, cloneElement } from 'react';
// import {
//   useFloating,
//   autoUpdate,
//   offset,
//   flip,
//   shift,
//   useHover,
//   useFocus,
//   useDismiss,
//   useRole,
//   useInteractions,
//   FloatingPortal,
//   arrow,
//   FloatingArrow as ReactFloatingArrow
// } from '@floating-ui/react';

export default { title: 'Solid: FloatingArrow' };

// export function FloatingArrow() {
//   return (
//     <div class="min-h-screen bg-gray-100 p-8">
//       <div class="max-w-4xl mx-auto space-y-8">
//         <h1 class="text-3xl font-bold text-gray-900 mb-8">
//           FloatingArrow Component Test
//         </h1>

//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {/* Button with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="This is a helpful tooltip with an arrow pointing to the button!">
//               <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
//                 Hover me
//               </button>
//             </TooltipWithArrow>
//           </div>

//           {/* Icon with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="Settings and configuration options">
//               <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
//                 <svg
//                   class="w-6 h-6 text-white"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
//                   />
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                   />
//                 </svg>
//               </div>
//             </TooltipWithArrow>
//           </div>

//           {/* Text with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="This text has additional context available on hover">
//               <span class="text-blue-600 underline cursor-help">
//                 Hover for more info
//               </span>
//             </TooltipWithArrow>
//           </div>

//           {/* Card with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="This card contains important information that you should definitely read">
//               <div class="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow">
//                 <h3 class="font-semibold text-gray-900">Info Card</h3>
//                 <p class="text-gray-600 text-sm">Hover to see tooltip</p>
//               </div>
//             </TooltipWithArrow>
//           </div>

//           {/* Badge with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="This indicates the current status of the system">
//               <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help">
//                 Active
//               </span>
//             </TooltipWithArrow>
//           </div>

//           {/* Link with tooltip */}
//           <div class="flex justify-center">
//             <TooltipWithArrow content="Learn more about FloatingUI and its amazing features">
//               <a
//                 href="#"
//                 class="text-purple-600 hover:text-purple-700 font-medium underline"
//                 onClick={(e) => e.preventDefault()}
//               >
//                 Documentation Link
//               </a>
//             </TooltipWithArrow>
//           </div>
//         </div>

//         <div class="mt-12 p-6 bg-white rounded-lg shadow-sm">
//           <h2 class="text-xl font-semibold text-gray-900 mb-3">
//             Test Instructions
//           </h2>
//           <ul class="space-y-2 text-gray-700">
//             <li>• Hover over any element to see the tooltip with arrow</li>
//             <li>• The arrow automatically points to the reference element</li>
//             <li>• Tooltips flip and shift to stay in viewport</li>
//             <li>• Focus elements with keyboard navigation</li>
//             <li>• Click outside or press Escape to dismiss</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }

// /**
//  * TooltipWithArrow:
//  *  - We remove the extra <div> wrapper around `children`.
//  *  - We clone the single child so that we can forward the `ref`, `tabIndex`, and
//  *    all of the interactions / floating-ui props directly onto that child.
//  *  - If the child is a non-focusable element (e.g. <div> or <span>), we
//  *    add tabIndex={0} so it becomes keyboard-focusable.
//  */
// function TooltipWithArrow({
//   children,
//   content,
// }: {
//   children: ReactElement;
//   content: React.ReactNode;
// }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const arrowRef = useRef<SVGSVGElement | null>(null);

//   const { refs, floatingStyles, context } = useFloating({
//     open: isOpen,
//     onOpenChange: setIsOpen,
//     middleware: [
//       offset(10),
//       flip(),
//       shift(),
//       arrow({
//         element: arrowRef,
//       }),
//     ],
//     whileElementsMounted: autoUpdate,
//   });

//   // Set up hover/focus/dismiss/role interactions
//   const hover = useHover(context);
//   const focus = useFocus(context);
//   const dismiss = useDismiss(context);
//   const role = useRole(context, { role: 'tooltip' });
//   const { getReferenceProps, getFloatingProps } = useInteractions([
//     hover,
//     focus,
//     dismiss,
//     role,
//   ]);

//   // We expect exactly one React element as `children`
//   if (!isValidElement(children)) {
//     console.warn('TooltipWithArrow expects a single React element child.');
//     return children;
//   }

//   // Check if the child is inherently focusable by looking at its type/props
//   const childType = (children.type as any);
//   const childProps: any = {};

//   // If it’s not a built-in focusable (button, a[href], input, etc.), add tabIndex=0.
//   // You can expand this list if you want to detect other native-focusable tags.
//   const FOCUSABLE_TAGS = ['button', 'a', 'input', 'select', 'textarea'];
//   const tagName =
//     typeof childType === 'string' ? childType.toLowerCase() : null;

//   if (!tagName || !FOCUSABLE_TAGS.includes(tagName)) {
//     childProps.tabIndex = 0;
//   }

//   // Merge the floating-ui “reference props” onto our child
//   const mergedProps = {
//     ref: refs.setReference,
//     ...getReferenceProps(childProps),
//   };

//   // Clone the child so we can inject ref, tabIndex, and onMouse/Focus handlers
//   const reference = cloneElement(children, mergedProps);

//   return (
//     <>
//       {reference}

//       <FloatingPortal>
//         {isOpen && (
//           <div
//             ref={refs.setFloating}
//             style={floatingStyles}
//             {...getFloatingProps()}
//             class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs z-50"
//           >
//             <ReactFloatingArrow ref={arrowRef} context={context} class="fill-gray-900" />
//             {content}
//           </div>
//         )}
//       </FloatingPortal>
//     </>
//   );
// }
