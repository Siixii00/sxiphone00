/* nds-pixel-theme.js
 *
 * Tiny activator for the NDS pixel theme. Adds
 * `data-theme="nds-pixel"` to <html> so all selectors in
 * `nds-pixel-theme.css` take effect.
 *
 * Usage in an app HTML file (after loading nds-pixel-theme.css):
 *   <script src="../scripts/nds-pixel-theme.js"></script>
 *
 * To disable per-app at runtime (e.g. via console / settings UI):
 *   window.SxNdsPixelTheme.disable();
 *   window.SxNdsPixelTheme.enable();
 */
(function () {
  'use strict';

  var ATTR = 'data-theme';
  var VALUE = 'nds-pixel';

  function enable() {
    try {
      document.documentElement.setAttribute(ATTR, VALUE);
      document.body && document.body.setAttribute(ATTR, VALUE);
    } catch (e) { /* noop */ }
  }

  function disable() {
    try {
      if (document.documentElement.getAttribute(ATTR) === VALUE) {
        document.documentElement.removeAttribute(ATTR);
      }
      if (document.body && document.body.getAttribute(ATTR) === VALUE) {
        document.body.removeAttribute(ATTR);
      }
    } catch (e) { /* noop */ }
  }

  function applyHomeOverrides() {
    if (typeof HomeApp !== 'undefined') {
      if (HomeApp.mapEngine) {
        HomeApp.mapEngine.tileSize = 32;
      }
      if (HomeApp.player) {
        HomeApp.player.moveSpeed = 0.08;
      }
    }
  }

  // Apply immediately so first paint is themed
  enable();

  // Re-apply once <body> is ready (in case script ran before body parse)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enable, { once: true });
  }

  // Apply home app overrides after delays to ensure home.js is fully initialized
  setTimeout(applyHomeOverrides, 200);
  setTimeout(applyHomeOverrides, 800);
  setTimeout(applyHomeOverrides, 1500);

  window.SxNdsPixelTheme = { enable: enable, disable: disable };
})();
