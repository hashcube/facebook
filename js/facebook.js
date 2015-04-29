import lib.Callback as Callback;

// Native is just imported for side effects. It will setup the window.FB object
// just as in the browser.
import .native.pluginImpl as nativeImpl;

/**
 * The devkit Facebook interface.
 * @constructor Facebook
 */
function Facebook () {
  // `onReady` is the only non-standard property on the facebook object.
  this.onReady = new Callback();
  if (window.FB) {
    // Facebook is ready for API calls
    this.onReady.fire();
  } else {
    // Use facebook fbAsyncInit callback
    window.fbAsyncInit = bind(this.onReady, this.onReady.fire);
  }

  /**
   * Wrap all of the methods and object properties of the plugin
   * implementation. We don't have a plugin implementation until FB.js is ready
   * and `init` is called on this class.
   */

  // Proxy all of the methods due to FB.js async loading. We wrap init below.
  var methods = [
    'api',
    'ui',
    'getLoginStatus',
    'login',
    'logout',
    'getAuthResponse',
    'sendAppEventPurchased',
    'sendAppEventAchievement'
  ];

  methods.forEach(bind(this, function (method) {
    this[method] = bind(this, function () {
      this.pluginImpl[method].apply(this.pluginImpl, arguments);
    });
  }));

  // Same with object properties.
  var properties = [
    'Canvas',
    'XFBML',
    'Event'
  ];

  properties.forEach(bind(this, function (prop) {
    Object.defineProperty(this, prop, {
      enumerable: true,
      get: bind(this, function () {
        return this.pluginImpl[prop];
      })
    });
  }));

  // pluginImpl is a non-enumerable property of the GC FB plugin
  Object.defineProperty(this, 'pluginImpl', {
    get: function () { return window.FB; }
  });
}

/**
 * Initialize the facebook plugin. This is a lightweight wrapper around the
 * FB.init method.
 *
 * @example
 *
 *    FB.initFacebook({
 *      appId      : '{your-app-id}',
 *      status     : true,
 *      xfbml      : true,
 *      version    : 'v2.0'
 *    });
 *
 * The appId `mockid` will result in a mock implementation for offline testing
 *
 */

Facebook.prototype.init = function (opts) {
  // Initialize FB
  this.pluginImpl.init(opts);
};

exports = new Facebook();
