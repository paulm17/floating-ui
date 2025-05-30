import {
  createEffect,
  JSX,
  mergeProps,
  onCleanup,
  ParentComponent,
  splitProps,
} from 'solid-js';
import {getPlatform} from '../utils/platform';

let lockCount = 0;
const scrollbarProperty = '--floating-ui-scrollbar-width';
let cleanupLock: () => void = () => {};

function enableScrollLock() {
  const platform = getPlatform();
  const isIOS =
    /iP(hone|ad|od)|iOS/.test(platform) ||
    // iPads can claim to be MacIntel
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const bodyStyle = document.body.style;
  // RTL <body> scrollbar
  const scrollbarX =
    Math.round(document.documentElement.getBoundingClientRect().left) +
    document.documentElement.scrollLeft;
  const paddingProp = scrollbarX ? 'paddingLeft' : 'paddingRight';
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  const scrollX = bodyStyle.left ? parseFloat(bodyStyle.left) : window.scrollX;
  const scrollY = bodyStyle.top ? parseFloat(bodyStyle.top) : window.scrollY;

  bodyStyle.overflow = 'hidden';
  bodyStyle.setProperty(scrollbarProperty, `${scrollbarWidth}px`);

  if (scrollbarWidth) {
    bodyStyle[paddingProp] = `${scrollbarWidth}px`;
  }

  // Only iOS doesn't respect `overflow: hidden` on document.body, and this
  // technique has fewer side effects.
  if (isIOS) {
    // iOS 12 does not support `visualViewport`.
    const offsetLeft = window.visualViewport?.offsetLeft || 0;
    const offsetTop = window.visualViewport?.offsetTop || 0;

    Object.assign(bodyStyle, {
      position: 'fixed',
      top: `${-(scrollY - Math.floor(offsetTop))}px`,
      left: `${-(scrollX - Math.floor(offsetLeft))}px`,
      right: '0',
    });
  }

  return () => {
    Object.assign(bodyStyle, {
      overflow: '',
      [paddingProp]: '',
    });
    bodyStyle.removeProperty(scrollbarProperty);

    if (isIOS) {
      Object.assign(bodyStyle, {
        position: '',
        top: '',
        left: '',
        right: '',
      });
      window.scrollTo(scrollX, scrollY);
    }
  };
}

export const FloatingOverlay: ParentComponent<
  Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> & {
    lockScroll?: boolean;
    style?: JSX.CSSProperties;
  }
> = (props) => {
  const mergedProps = mergeProps({lockScroll: false}, props);
  const [local, rest] = splitProps(mergedProps, ['style', 'lockScroll']);

  createEffect(() => {
    if (!local.lockScroll) {
      return;
    }

    lockCount++;
    if (lockCount === 1) {
      cleanupLock = enableScrollLock();
    }

    onCleanup(() => {
      lockCount--;
      if (lockCount === 0) {
        cleanupLock();
      }
    });
  });

  return (
    <div
      {...rest}
      style={{
        position: 'fixed',
        overflow: 'auto',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...local.style,
      }}
    />
  );
};
