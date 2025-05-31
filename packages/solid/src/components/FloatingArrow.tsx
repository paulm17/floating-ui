import { platform } from "@floating-ui/dom";
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  JSX,
  mergeProps,
  onCleanup,
  splitProps,
} from "solid-js";

import type { Alignment, FloatingContext, Side } from "../types";

export interface FloatingArrowProps {
  // Omit the original `refs` property from the context to avoid issues with
  // generics: https://github.com/floating-ui/floating-ui/issues/2483
  /**
   * The floating context.
   */
  context: Accessor<FloatingContext>;

  /**
   * Width of the arrow.
   * @default 14
   */
  width?: number;

  /**
   * Height of the arrow.
   * @default 7
   */
  height?: number;

  /**
   * The corner radius (rounding) of the arrow tip.
   * @default 0 (sharp)
   */
  tipRadius?: number;

  /**
   * Forces a static offset over dynamic positioning under a certain condition.
   */
  staticOffset?: string | number | null;

  /**
   * Custom path string.
   */
  d?: string;

  /**
   * Stroke (border) color of the arrow.
   */
  stroke?: string;

  /**
   * Stroke (border) width of the arrow.
   */
  strokeWidth?: number;
}

/**
 * Renders a pointing arrow triangle.
 * @see https://floating-ui.com/docs/FloatingArrow
 */
export const FloatingArrow: Component<
  JSX.SvgSVGAttributes<SVGSVGElement> & FloatingArrowProps
> = (props) => {
  // In dev, warn if no ref was passed.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line solid/reactivity
    if (!props.ref) {
      console.warn(
        "Floating UI: The `ref` prop is required for the `FloatingArrow`",
        "component."
      );
    }
  }

  // Merge in our defaults.
  const merged = mergeProps(
    { width: 14, height: 7, tipRadius: 0, strokeWidth: 0, staticOffset: null },
    props
  );

  // Split out everything we care about from `props`.
  const [local, rest] = splitProps(merged, [
    "context",
    "width",
    "height",
    "tipRadius",
    "strokeWidth",
    "staticOffset",
    "d",
    "stroke",
    "style",
  ]);

  // Custom CSS string parser to replace style-to-object dependency
  function parseStyleString(styleStr: string) {
    const styleObj = {};
    
    if (!styleStr || typeof styleStr !== 'string') {
      return styleObj;
    }
    
    // Split by semicolon and process each declaration
    const declarations = styleStr.split(';');
    
    for (const declaration of declarations) {
      const trimmed = declaration.trim();
      if (!trimmed) continue;
      
      // Find the first colon to split property and value
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const property = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      
      if (property && value) {
        // Convert kebab-case to camelCase for React/JS compatibility
        const camelProperty = property.replace(/-([a-z])/g, (match, letter) => 
          letter.toUpperCase()
        );
        // @ts-ignore
        styleObj[camelProperty] = value;
      }
    }
    
    return styleObj;
  }

  // Create a unique ID for the <clipPath> (just like React's `useId`).
  const clipPathId = createUniqueId();

  // Track whether `floating` is rendered in RTL.
  const [isRTL, setIsRTL] = createSignal(false);

  // Because we need to access getComputedStyle on the `floating` element,
  // run a “layout-style” effect. Solid doesn't have a hook exactly like
  // `useModernLayoutEffect`, but `createEffect` will run after DOM mutations
  // in the browser. The important part is to re-check whenever `floating` changes.
  createEffect(() => {
    const ctx = local.context();
    const floatingEl = ctx.refs?.floating?.() as HTMLElement | undefined;
    if (!floatingEl) {
      setIsRTL(false);
      return;
    }

    // If the element is in RTL mode, set our signal.
    const cssDir = getComputedStyle(floatingEl).direction;
    setIsRTL(cssDir === "rtl");
  });

  // Now build a memoized object that mirrors what the React version did,
  // including:
  //  1. Early‐return if there’s no `floating` (React returned null).
  //  2. “Disable” `staticOffset` if the `shift` middleware has already shifted
  //     in the same axis.
  //  3. Compute stroke widths, SVG geometry, props like xOffsetProp/yOffsetProp,
  //     rotation, etc., exactly as in React.

  const calculated = createMemo(() => {
    const ctx = local.context();
    const { placement, middlewareData, elements: { floating } = {} } = ctx;

    // 1. If there’s no `floating` element yet, bail out. We’ll return `null` in the render.
    if (!floating) {
      return null;
    }

    // Destructure the middleware data we need:
    const arrowData = middlewareData.arrow;
    const shiftData = middlewareData.shift;

    // Basic numbers and flags:
    const width = local.width!;
    const height = local.height!;
    const tipRadius = local.tipRadius!;
    const rawStroke = local.stroke;
    const rawStrokeWidth = local.strokeWidth ?? 0;

    // Double the stroke width internally (React did this so that `strokeWidth` “feels”
    // like the border width, instead of the SVG stroke).
    const computedStrokeWidth = rawStrokeWidth * 2;
    const halfStrokeWidth = computedStrokeWidth / 2;

    // The “static offset” can be either a number or string or null.
    // In React, they disabled it if the shift middleware changed the arrow
    // along the same axis. Let’s do that too:
    const [side, alignment] = (placement ?? "").split("-") as [
      Side,
      Alignment
    ];
    const isVerticalSide = side === "top" || side === "bottom";

    let computedStaticOffset: string | number | null = local.staticOffset ?? null;
    // If shift has already nudged us on the same axis, null out staticOffset:
    if (
      (isVerticalSide && shiftData?.x != null) ||
      (!isVerticalSide && shiftData?.y != null)
    ) {
      computedStaticOffset = null;
    }

    // Compute the “point geometry” exactly as React did:
    //   svgX = (width/2) * (tipRadius / -8 + 1)
    //   svgY = ((height/2) * tipRadius) / 4
    const svgX = (width / 2) * (tipRadius / -8 + 1);
    const svgY = ((height / 2) * tipRadius) / 4;

    const isCustomShape = !!local.d;

    // Which side: “top”, “bottom”, “left”, “right”
    // alignment: “start”, “center” (omitted), “end”
    // (React automatically defaulted “alignment” to “start” if there was no “-”)
    // but `.split("-")` will just produce `[side]` or `[side, alignment]`.

    // Arrow offsets from middleware:
    const arrowX = arrowData?.x != null ? computedStaticOffset ?? arrowData.x : "";
    const arrowY = arrowData?.y != null ? computedStaticOffset ?? arrowData.y : "";

    // The SVG path “d” string:
    const dValue =
      local.d ||
      `M0,0 H${width} L${width - svgX},${height - svgY} Q${width / 2},${height} ${svgX},${height - svgY} Z`;

    // Rotation logic (exactly as React):
    const rotationMap: Record<Side, string> = {
      top: isCustomShape ? "rotate(180deg)" : "",
      left: isCustomShape ? "rotate(90deg)" : "rotate(-90deg)",
      bottom: isCustomShape ? "" : "rotate(180deg)",
      right: isCustomShape ? "rotate(-90deg)" : "rotate(90deg)",
    };
    const rotation = rotationMap[side as Side] || "";

    // Now figure out xOffsetProp / yOffsetProp (i.e., which CSS property to set):
    // React did it like this:
    //   yOffsetProp = computedStaticOffset && alignment === 'end' ? 'bottom' : 'top'
    //   xOffsetProp = computedStaticOffset && alignment === 'end' ? 'right' : 'left'
    //   if (computedStaticOffset && isRTL) { toggle left/right }
    // BUT they only applied that “staticOffset” logic if NOT on a vertical side.
    // Let’s re-create it line-for-line:

    const yOffsetProp =
      computedStaticOffset && alignment === "end" ? "bottom" : "top";

    let xOffsetProp =
      computedStaticOffset && alignment === "end" ? "right" : "left";

    // If we are RTL and we had a staticOffset, reverse left/right.
    if (computedStaticOffset && isRTL()) {
      xOffsetProp = alignment === "end" ? "left" : "right";
    }

    // Finally, we need to split `local.style` into `transform` and “the rest”.
    // React did: `style: { transform, ...restStyle } = {}`
    // In Solid, `local.style` might be a string or an object. We’ll parse if needed.
    let styleObj: Record<string, any> = {};
    if (typeof local.style === "string") {
      try {
        styleObj = parseStyleString(local.style);
      } catch {
        styleObj = {};
      }
    } else if (local.style && typeof local.style === "object") {
      styleObj = { ...local.style };
    }

    // Pull out `transform` if present:
    const transformValue = (styleObj.transform as string) ?? "";
    delete styleObj.transform;
    const restStyle = styleObj;

    // Build & return our “calculated” shape. If `floating` is falsy, we returned `null` above.
    return {
      width,
      height,
      computedStrokeWidth,
      halfStrokeWidth,
      svgX,
      svgY,
      isCustomShape,
      side: side as Side,
      isVerticalSide,
      alignment: (alignment as Alignment) || "start",
      rotation,
      arrowX,
      arrowY,
      dValue,
      rawStroke,
      computedStaticOffset,
      xOffsetProp,
      yOffsetProp,
      transformValue,
      restStyle,
      floating: floating() as HTMLElement,
    };
  });

  // In Solid, we can’t early‐return a component from inside a `createMemo`; we have to
  // check outside. If `calculated()` is `null`, don’t render anything:
  const calc = calculated();
  if (calc === null) {
    return null;
  }

  return (
    <svg
      {...rest}
      aria-hidden
      ref={props.ref}
      width={
        calc.isCustomShape
          ? calc.width
          : calc.width + calc.computedStrokeWidth
      }
      height={calc.width}
      viewBox={`0 0 ${calc.width} ${
        calc.height > calc.width ? calc.height : calc.width
      }`}
      style={{
        position: "absolute",
        "pointer-events": "none",
        // Place the arrow using computed offset props (React used “[xOffsetProp]: arrowX” syntax)
        [calc.xOffsetProp]: `${calc.arrowX}`, // already either `""` or a number/string
        [calc.yOffsetProp]: `${calc.arrowY}`,
        // If vertical side OR a custom shape, “100%”; otherwise subtract half the stroke width
        [calc.side]:
          calc.isVerticalSide || calc.isCustomShape
            ? "100%"
            : `calc(100% - ${calc.computedStrokeWidth / 2}px)`,
        transform: `${calc.rotation} ${calc.transformValue}`.trim(),
        ...calc.restStyle,
      }}
    >
      {calc.computedStrokeWidth > 0 && (
        <path
          clip-path={`url(#${clipPathId})`}
          fill="none"
          stroke={calc.rawStroke ?? "currentColor"}
          // Account for stroke on the fill path rendered below. React did: `strokeWidth + (d ? 0 : 1)`
          stroke-width={
            calc.computedStrokeWidth + (calc.isCustomShape ? 0 : 1)
          }
          d={calc.dValue}
        />
      )}
      {/* In Firefox, for left/right placements there's a ~0.5px gap where the
          border can show through. Adding a stroke on the fill removes it. */}
      <path
        stroke={
          calc.computedStrokeWidth && !calc.isCustomShape
            ? (rest.fill as string) || "none"
            : "none"
        }
        d={calc.dValue}
      />
      {/* Assume the border-width of the floating element matches the stroke. */}
      <clipPath id={clipPathId}>
        <rect
          x={-calc.halfStrokeWidth}
          y={
            calc.halfStrokeWidth * (calc.isCustomShape ? -1 : 1)
          }
          width={calc.width + calc.computedStrokeWidth}
          height={calc.width}
        />
      </clipPath>
    </svg>
  );
};
