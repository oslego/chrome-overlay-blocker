# Overlay Blocker

An experimental browser extension for Google Chrome which attempts to block annoying full-page overlays, like ads and newsletter signup forms, from interrupting your browsing.

**This is still a proof of concept. It will fail to identify and block some overlays.** Please [open an issue](https://github.com/oslego/chrome-overlay-blocker/issues) mentioning the URL where it failed so I can try to improve it.

## How do I know it works?

When the extension identifies an element which is _likely_ to be an overlay, it removes it from the page and logs it in the browser console like this:

```html
[Overlay Blocker extension]
Removed:
 <div class=​"overlay">​</div>​
```

You can test it against the `index.html` file provided in this repository.

## How to install

- clone or download this repository

```
git clone git@github.com:oslego/chrome-overlay-blocker.git
```

- navigate to `chrome://extensions` in Google Chrome
- tick the checkbox labeled _Developer mode_
- click _Load unpacked extension_
- browse to the cloned repository folder and press _Select_.

## How it works

Document-wide [`MutationObservers`](https://developer.mozilla.org/en/docs/Web/API/MutationObserver) are expensive. This experiment injects a stylesheet (at `document_idle`) which applies a noop CSS Animation to all elements that have a `class` or `style` attribute. This **will not** immediately animate all elements on the page. Read on.

The script listens to `animationstart` events then does element hit testing on the page. If it identifies an element with a large surface, it checks to see if it's `position: fixed` and if yes, it removes it.

The quirk exploited here is that `animationstart` will trigger only on elements that change from `display: hidden` to `display: block` _after_ the initial page load. This is thanks to the noop CSS Animation styles being injected by the content script at `document_idle`.

There's a built-in mechanism to pause detection for overlays that may have appeared as a result of user interaction (click, keydown, etc.). This _should_ prevent accidental removal of large menus, expected modals, etc.

Checking for CSS `position: fixed` is expensive because it requires a call to `window.getComputedStyle()`. This is kept to a minimum because frequent calls will substantially degrade performance. Hit testing is employed to reduce the number of elements checked. This is the extension's major limitation at this time. Overlays with a small surface or overlays not nested within their "backdrop" element (the one that masks the page) may be missed.

If you have a better idea for a performant way to check if an element is an overlay, please let me know. Open an issue or submit a pull request.

## Caveats
 This experimental extension:
 - _may_ break CSS animations on pages
 - _may_ negatively impact performance on complex pages that do **a lot** of DOM manipulation. If so, disable it, retry, and open an issue with the URL where it substantially impacted performance.
