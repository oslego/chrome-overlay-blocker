(function(){

  const css = `
    [style],[class] { animation: signal 0s 1 }
    @keyframes signal {  }
  `;

  // Store functions that undo the node removal operation.
  // This mitigates false positive matches and gives the user a chance to undo.
  const undoActions = {};

  // Cache the timestamp of the user's last UI event;
  let lastUIEventTime = null;

  function injectStyles(cssText) {
    return new Promise((resolve, reject) => {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.textContent = cssText
      resolve(document.body.appendChild(style))
    })
  }

  function listenToAnimations() {
    // Run on rAF because to will trigger listeners after the the zero-duration animation's start.
    requestAnimationFrame(function(){
      document.documentElement.addEventListener('animationstart', e => {
        // Don't react within 100ms of user's last event; it may be an expected overlay.
        if (Date.now() - lastUIEventTime < 100) {
          return;
        }

        // TODO: figure out a more robust yet performant way to find the fixed element;
        // TODO: this logic misses smaller overlays that are NOT nested in their full width backdrop element.
        // Hit testing for elements at top-left and bottom-right quarters of the viewport
        const elAtTopQuarter = document.elementFromPoint(window.innerWidth * 0.25, window.innerHeight * 0.25)
        const elAtBottomQuarter = document.elementFromPoint(window.innerWidth * 0.75, window.innerHeight * 0.75)

        // If they're the same, it's likely an overlay. Let's check.
        if (elAtTopQuarter === elAtBottomQuarter) {
          const position = getComputedStyle(elAtTopQuarter).position;
          if (position === 'fixed') {
            detachNode(elAtTopQuarter)
          }
        }

      });
    });
  }

  function detachNode(target) {
    // Find target node's position in DOM tree; used later for undo support
    const nextSibling = target.nextElementSibling;
    const parentNode = target.parentNode;
    const key = `${target.tagName.toLowerCase()}.${Array.from(target.classList).join('.')}`;

    // Detach target from DOM tree
    target.parentNode.removeChild(target);

    console.log('%c[Overlay Blocker extension]\n%cRemoved:\n', "color: blue;", "color: black", target);

    // TODO: hook this up to an extension browser action per Tab so users can undo.
    undoActions[key] = function() {
      if (nextSibling){
        nextSibling.parentNode.insertBefore(target, nextSibling);
      } else {
        parentNode.appendChild(target);
      }
    }
  }

  function setUIEventHandlers() {
    ['click', 'keyup', 'pointerup'].map(eventName => {
      document.addEventListener(eventName, e => { lastUIEventTime = Date.now() })
    })
  }

  injectStyles(css)
    .then(listenToAnimations)
    .then(setUIEventHandlers);

})();
