import {getNodeName} from '@floating-ui/utils/dom';
import {getDocument} from '../utils/element';

type Undo = () => void;

let counterMap = new WeakMap<Element, number>();
let uncontrolledElementsSet = new WeakSet<Element>();
let markerMap: Record<string, WeakMap<Element, number>> = {};
let lockCount = 0;

/** feature‐detect native `inert` support */
export const supportsInert = (): boolean =>
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

/** walk out of shadow‐DOM to a host that the body actually contains */
const unwrapHost = (node: Element | ShadowRoot): Element | null =>
  node && ((node as ShadowRoot).host || unwrapHost(node.parentNode as Element));

/** drop any targets that aren’t actually in the body (or are in a shadow tree) */
const correctElements = (parent: HTMLElement, targets: Element[]): Element[] =>
  targets
    .map((target) => {
      if (parent.contains(target)) return target;
      const host = unwrapHost(target);
      return host && parent.contains(host) ? host : null;
    })
    .filter((el): el is Element => el !== null);

function applyAttributeToOthers(
  uncorrectedAvoidElements: Element[],
  body: HTMLElement,
  ariaHidden: boolean,
  inert: boolean,
): Undo {
  const markerName = 'data-floating-ui-inert';
  // pick `inert` if requested *and* supported; otherwise fall back to aria-hidden
  const controlAttribute = inert && supportsInert()
    ? 'inert'
    : ariaHidden
    ? 'aria-hidden'
    : null;

  const avoidElements = correctElements(body, uncorrectedAvoidElements);
  const elementsToKeep = new Set<Node>();
  const elementsToStop = new Set<Node>(avoidElements);
  const hiddenElements: Element[] = [];

  // one WeakMap per markerName
  if (!markerMap[markerName]) {
    markerMap[markerName] = new WeakMap();
  }
  const markerCounter = markerMap[markerName];

  // walk up from each avoidElement to root, marking nodes we *must* keep visible
  avoidElements.forEach((el) => {
    let curr: Node | null = el;
    while (curr && !elementsToKeep.has(curr)) {
      elementsToKeep.add(curr);
      curr = curr.parentNode;
    }
  });

  // deep‐traverse to hide everything not in elementsToKeep or elementsToStop
  function deep(parent: Element | null) {
    if (!parent || elementsToStop.has(parent)) return;

    // use the original Array#forEach
    Array.prototype.forEach.call(parent.children, (node: Element) => {
      if (getNodeName(node) === 'script') return;

      if (elementsToKeep.has(node)) {
        deep(node);
      } else {
        const alreadyHidden = controlAttribute
          ? node.getAttribute(controlAttribute) !== null &&
            node.getAttribute(controlAttribute) !== 'false'
          : false;
        const prevCount = counterMap.get(node) || 0;
        const newCount = controlAttribute ? prevCount + 1 : prevCount;
        const prevMarker = markerCounter.get(node) || 0;
        const newMarker = prevMarker + 1;

        counterMap.set(node, newCount);
        markerCounter.set(node, newMarker);
        hiddenElements.push(node);

        // remember nodes that were hidden *before* we touched them
        if (newCount === 1 && alreadyHidden) {
          uncontrolledElementsSet.add(node);
        }

        // whenever we first mark with this marker, set the data attribute
        if (newMarker === 1) {
          node.setAttribute(markerName, '');
        }

        // only add our attribute if it wasn’t already hidden
        if (!alreadyHidden && controlAttribute) {
          node.setAttribute(
            controlAttribute,
            controlAttribute === 'inert' ? '' : 'true'
          );
        }
      }
    });
  }

  deep(body);
  lockCount++;

  return () => {
    // undo in reverse order
    hiddenElements.forEach((el) => {
      const prevCount = counterMap.get(el) || 0;
      const newCount = controlAttribute ? prevCount - 1 : prevCount;
      const prevMarker = markerCounter.get(el) || 0;
      const newMarker = prevMarker - 1;

      counterMap.set(el, newCount);
      markerCounter.set(el, newMarker);

      if (newCount === 0) {
        if (!uncontrolledElementsSet.has(el) && controlAttribute) {
          el.removeAttribute(controlAttribute);
        }
        uncontrolledElementsSet.delete(el);
      }

      if (newMarker === 0) {
        el.removeAttribute(markerName);
      }
    });

    lockCount--;
    if (lockCount === 0) {
      counterMap = new WeakMap();
      uncontrolledElementsSet = new WeakSet();
      markerMap = {};
    }
  };
}

/**
 * Hide everything *except* the passed elements and live regions.
 * @param avoidElements elements (and their ancestors) to remain interactive
 * @param ariaHidden if true, toggles `aria-hidden="true"` on siblings
 * @param inert if true *and* supported, toggles `inert` instead
 */
export function markOthers(
  avoidElements: Element[],
  ariaHidden = false,
  inert = false,
): Undo {
  // if getDocument().body is ever null, fall back to global document.body
  const doc = getDocument(avoidElements[0]);
  const body = (doc && doc.body) || document.body;
  const liveRegions = Array.from(body.querySelectorAll('[aria-live]'));
  return applyAttributeToOthers(
    [...avoidElements, ...liveRegions],
    body,
    ariaHidden,
    inert,
  );
}
