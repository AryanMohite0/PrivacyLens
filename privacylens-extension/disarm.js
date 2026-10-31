// PRIVACYLENS — Main World In-Page Safe Recorder Neutralizer
// Runs natively in the page context at document_start without violating CSP
(function () {
  try {
    // Provide safe no-op stubs so page scripts don't crash when recorders are blocked via DNR
    if (typeof window.clarity === 'undefined') {
      window.clarity = function () {};
    }
    if (typeof window.hj === 'undefined') {
      window.hj = function () {};
      window._hjSettings = {};
    }
    if (typeof window.FS === 'undefined') {
      window.FS = function () {};
      window._fs_loaded = true;
    }
    if (typeof window.LO === 'undefined') {
      window.LO = function () {};
    }
    if (typeof window.fbq === 'undefined') {
      window.fbq = function () {};
    }
    window['ga-disable-UA-'] = true;
    window['ga-disable-G-'] = true;
  } catch (_) {}
})();

