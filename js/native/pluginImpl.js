import device;
import lib.PubSub;
from .ResponseTransform import ResponseTransform;

/**
 * get wrapped functions for native plugin
 *
 * @param {string} pluginName
 * @return {NativeInterface<pluginName>}
 */

function getNativeInterface (pluginName, opts) {
  opts = opts || {};
  var events = new lib.PubSub();
  GC.plugins.register(pluginName, events);
  return {
    notify: function sendNativeEvent (event, data) {
      data = JSON.stringify(data || {});
      NATIVE.plugins.sendEvent(pluginName, event, data);
    },
    request: function sendNativeRequest (event, data, cb) {
      logger.log('[js] {facebook} sending request', event);
      logger.log('\tdata:', JSON.stringify(data, null, '\t'));

      if (typeof data === 'function') {
        cb = data;
        data = {};
      }

      var fn = opts.noErrorback ? function ignoreErrorParameter (err, res) {
        cb(res);
      } : cb;

      // To make life easy in android, we handle optional string results.
      var unpackResults = function unpackResults (err, res) {
        if (err) {
          if (typeof err === 'string') {
            try {
              err = JSON.parse(err);
            } catch (e) {
              // pass
            }
          }
        }

        if (typeof res === 'string') {
          try {
            res = JSON.parse(res);
          } catch (e) {
            // pass
          }

          if (res === '') {
            res = void 0;
          }
        }

        if (res && res.error && res.error.code === 190) {
          events.emit('fb:apprevoked');
        }

        fn(err, res);
      };

      NATIVE.plugins.sendRequest(pluginName, event, data, unpackResults);
    },
    subscribe: function onNativeEvent (event, cb) {
      function tryParseEventData (res) {
        if (res && typeof res === 'string') {
          try {
            res = JSON.parse(res);
          } catch (e) {
             // pass
          }
        }
        cb(res);
      }
      cb.__parser = tryParseEventData;
      events.subscribe(event, tryParseEventData);
    },
    unsubscribe: function unsubscribeFromNativeEvent (event, cb) {
      events.unsubscribe(event, cb.__parser);
    }
  };
}

/**
 * Native interface for facebook plugin
 */

var nativeFB = getNativeInterface('FacebookPlugin', {noErrorback: true});

/**
 * Wait for native plugin to initialize and then create the facebook interface
 * at window.FB. This event will never fire in the browser.
 */

nativeFB.subscribe('FacebookPluginReady', function () {
  logger.log(
    '[JS] {facebook}', '\n\tGot FacebookPluginReady\n\tCreating Wrapper'
  );

  window.FB = createNativeFacebookWrapper();

  logger.log(
    '[JS] {facebook}', '\n\tRunning async init'
  );

  var fbReadyFn = window.fbAsyncInit;
  if (fbReadyFn) {
    fbReadyFn();
  }
});

function createNativeFacebookWrapper () {

  // Return an object that looks just like the standard javascript facebook
  // interface
  return {
    init: function FBNativeInit (opts) {
      // ResponseTransformer resolves api discrepancies between javascript,
      // iOS, and Android.
      var transform = ResponseTransform.getTransformer(opts);
      logger.log('{facebook} transform', transform);
      Object.defineProperties(this, {
        // Add `transform` to `this`, but don't give visibility outside the FB
        // object.
        transform: {
          get: function () { return transform; }
        }
      });

      if (typeof opts.appId === 'number') {
        opts.appId = opts.appId + '';
        logger.warn('coercing appId to string');
      }
      logger.log('[js] {facebook} sending init');
      nativeFB.notify('facebookInit', opts);
      logger.log('[js] {facebook} init done');
    },
    /**
     * FB.api
     *
     * @param {string} path
     * @param {string} [method]
     * @param {object} [params]
     * @param {function} callback
     */
    api: function FBNativeApi (path, method, params, cb) {
      // Handle overloaded api
      var opts;
      if (typeof method === 'function') {
        // Handle FB.api('/path', cb);
        cb = method;
        opts = {
          path: path
        };
      } else if (typeof method === 'object') {
        // Handle FB.api('/path', params, cb);
        cb = params;
        opts = {
          params: method,
          path: path
        };
      } else if (typeof params === 'function') {
        // Handle FB.api('/path', 'method', cb);
        cb = params;
        opts = {
          method: method,
          path: path
        };
      } else {
        // Handle FB.api('/path', 'method', params, cb);
        opts = {
          params: params, method: method, path: path
        };
      }

      opts.params = opts.params || {};
      opts.method = opts.method || 'get';

      // does path need to be parsed here to send this to the correct native
      // method?
      var transform = this.transform;

      // Nested objects are not handled correctly on native. This code could be
      // more simple, but i think the functional nature makes it clear what's
      // happening.
      opts.params = Object.keys(opts.params).reduce(function (params, key) {
        if (opts.params[key].toString() === '[object Object]') {
          params[key] = JSON.stringify(opts.params[key]);
        } else {
          params[key] = opts.params[key];
        }
        return params;
      }, {});

      // Send the request
      nativeFB.request('api', opts, function (res) {
        return cb(transform.api(opts, res));
      });
    },
    /**
     * Open some facebook UI.
     * @param {object} params - requires `method` and has various extra things
     * based on the dialog. We currently support the requests dialog.
     */
    ui: function FBNativeUi (params, cb) {
      var transform = this.transform;
      nativeFB.request('ui', params, function (res) {
        return cb(transform.ui(params, res));
      });
    },

    /**
     * @method getLoginStatus
     */

    getLoginStatus: function FBNativeGetLoginStatus (cb) {
      nativeFB.request('getLoginStatus', cb);
    },

    /**
     * @type FBLoginResponse
     * @param {object} AuthResponse
     * @param {string} AuthResponse.accessToken
     * @param {number} AuthResponse.expiresIn
     * @param {string} AuthResponse.grantedScopes
     * @param {string} AuthResponse.signedRequest
     * @param {string} AuthResponse.userID
     * @param {string} status
     */

    /**
     * @method login
     *
     * The callback will be resolved with a {FBLoginResponse}
     */

    login: function FBNativeLogin (cb, data) {
      nativeFB.request('login', data, cb);
    },

    /**
     * @method logout
     */

    logout: function FBNativeLogout (cb) {
      nativeFB.request('logout', cb);
    },

    /**
     * @method getAuthResponse
     */

    getAuthResponse: function FBNativeGetAuthResponse (cb) {
      nativeFB.request('getAuthStatus', cb);
    },

    /**
     * @object AppEvents
     *
     * Proper namespace for the AppEvents methods and properties
     */

    AppEvents: {

      /**
       * @method logEvent
       *
       * @param {string} eventName
       * @param {number} valueToSum   (optional)
       * @param {object} [parameters] (optional)
       */

      logEvent: function FBNativeLogEvent () {
        nativeFB.notify('logEvent', {
          eventName:  arguments[0],
          valueToSum: arguments[1]||null,
          parameters: arguments[2]||{}
        });
      },

      /**
       * @method logPurchase
       */

      logPurchase: function FBNativeLogPurchase () {
        nativeFB.notify('logPurchase', {
          purchaseAmount: arguments[0],
          currency:       arguments[1]||"USD",
          parameters:     arguments[2]||{}
        });
      },

      /**
       * Predefined Events and Parameters
       *
       *    These are same on all platforms: iOS, Android and Canvas
       */

      EventNames: {
        ACHIEVED_LEVEL:         "fb_mobile_level_achieved",
        ADDED_PAYMENT_INFO:     "fb_mobile_add_payment_info",
        ADDED_TO_CART:          "fb_mobile_add_to_cart",
        ADDED_TO_WISHLIST:      "fb_mobile_add_to_wishlist",
        COMPLETED_REGISTRATION: "fb_mobile_complete_registration",
        COMPLETED_TUTORIAL:     "fb_mobile_tutorial_completion",
        INITIATED_CHECKOUT:     "fb_mobile_initiated_checkout",
        RATED:                  "fb_mobile_rate",
        SEARCHED:               "fb_mobile_search",
        SPENT_CREDITS:          "fb_mobile_spent_credits",
        UNLOCKED_ACHIEVEMENT:   "fb_mobile_achievement_unlocked",
        VIEWED_CONTENT:         "fb_mobile_content_view"
      },

      ParameterNames: {
        CONTENT_ID:             "fb_content_id",
        CONTENT_TYPE:           "fb_content_type",
        CURRENCY:               "fb_currency",
        DESCRIPTION:            "fb_description",
        LEVEL:                  "fb_level",
        MAX_RATING_VALUE:       "fb_max_rating_value",
        NUM_ITEMS:              "fb_num_items",
        PAYMENT_INFO_AVAILABLE: "fb_payment_info_available",
        REGISTRATION_METHOD:    "fb_registration_method",
        SEARCH_STRING:          "fb_search_string",
        SUCCESS:                "fb_success"
      }

    },

    /**
     * @property Event
     */

    Event: {
      subscribe: function FBNativeEventSubscribe (event, cb) {
        nativeFB.subscribe(event, cb);
      },
      unsubscribe: function FBNativeEventUnsubscribe (event, cb) {
        nativeFB.unsubscribe(event, cb);
      }
    },


    /**
     * New function shareImage
     * Uses messenger on native, falls back to regular sharing in browser.
     */
    shareImage: function nativeShareImage (opts, cb) {
      logger.log("facebook - sharing image");
      opts = JSON.parse(JSON.stringify(opts));

      if (!opts.image) {
        logger.log('facebook shareImage error - image required')
        return;
      }

      if (device.isSimulator) {
        window.open(opts.image, '_blank');
        cb && cb();
      } else {

        var rDataURI = /^data:image\/png;base64,/;
        if (rDataURI.test(opts.image)) {
          opts.image = opts.image.replace(rDataURI, '');
        }

        if (NATIVE && NATIVE.plugins && NATIVE.plugins.sendRequest) {
          NATIVE.plugins.sendRequest('FacebookPlugin', 'shareImage', opts, cb);
        }
      }
    },

    sendAppEventPurchased: function FBNativeSendAppEventPurchased (cost, currency, product_id) {
      nativeFB.notify('sendAppEventPurchased', {
        price: cost,
        currency: currency,
        content: product_id
      });
    },

    sendAppEventAchievement: function FBNativeSendAppEventAchievement (achievement, count) {
      nativeFB.notify('sendAppEventAchievement', {
        name: achievement,
        count: count
      });
    }

  };
}
