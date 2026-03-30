import React, { useCallback } from 'react';
import { useLayout } from './LayoutContext';
import type { PaneLinkProps } from './types';

/**
 * A link component that integrates with the pane-tabs-layout system.
 * When clicked, it calls the user-provided onOpenLink resolver via context.
 * If the resolver returns a TabData, the link opens as a tab instead of
 * navigating. If not, the click falls through to normal browser behavior.
 *
 * Use this component for explicit, opt-in link interception — useful when
 * linkInterception is set to 'manual', or when you want to pass a specific
 * target paneId.
 *
 * @example
 * ```tsx
 * import { PaneLink } from 'pane-tabs-layout';
 *
 * const Content = () => (
 *   <p>See also: <PaneLink href="/problem/456">Problem 456</PaneLink></p>
 * );
 * ```
 */
export const PaneLink: React.FC<PaneLinkProps> = ({
  href,
  paneId,
  children,
  onClick,
  ...rest
}) => {
  const { openLink } = useLayout();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let user's onClick run first
      onClick?.(e);
      if (e.defaultPrevented) return;

      const resolved = openLink(href, paneId);
      if (resolved) {
        e.preventDefault();
      }
    },
    [href, paneId, openLink, onClick]
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};