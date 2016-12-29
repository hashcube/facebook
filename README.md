Facebook Module for GameClosure Devkit
===============

The devkit facebook plugin provides native support with a matching API to the
JavaScript facebook API.

## Setup

### Installation

Add devkit-facebook to your dependencies section of the manifest.

Run
``` "devkit install https://github.com/hashcube/facebook.git" ```

### Config

There are a few keys you need to add to your _manifest.json_. This should cover
both iOS and Android.

```json
"addons": {
  "facebook": {
    "facebookAppID": "your-app-id",
    "facebookDisplayName": "your-app-display-name",
  }
}
```

### Integration

Import the facebook sdk into your code. You will want to wait for the SDK to
be ready before you do anything.

```javascript
import facebook as FB;

FB.onReady.run(function () {
  FB.init({
    appId: CONFIG.modules.facebook.facebookAppID,
    displayName: CONFIG.modules.facebook.facebookDisplayName,
    // other config
  });

  // Ready to use FB!
});
```

## API

The plugin was written such that the [Facebook JavaScript docs][facebook_js] can
be referenced as the sole source of truth with a couple of minor exceptions
which are documented here.

### Ready Detection
The main difference from the facebook API is how you detect when the plugin is
ready. The facebook docs suggest using `window.fbAsyncInit`, but the plugin uses
that internally to detect facebook ready status across native and browser.
Instead, you should use `FB.onReady.run(cb)` where cb is the code you want to
run when facebook is ready.

### FB.init
For native, you also need to pass `displayName` to your FB.init call.

### FB.api
There's probably hiccups with a lot of the endpoints here presently. For
example, the `actions` parameter of [/me/feed][user_feed_docs] is not handled
and will cause errors. At this point, I would recommend against any nested
properties / arrays with this API.

### FB.login

The native Facebook SDKs prevent an app from requesting write permissions during
the initial login. Thus, you **must only ask for read permissions** during the
first login. Ask for write permissions the first time a user tries to share from
your app.

### FB.AppEvents

AppEvents are enabled - basic analytic data is sent to Facebook
out-of-the-box. The `logEvent` and `logPurchase` methods are exposed as well as
the predefined events and parameters.

There are some great videos about App Events from the F8 conference:

 * [F8 Video List](https://developers.facebooklive.com/)
 * [Implementing and Understanding Facebook Analytics for Apps](https://developers.facebooklive.com/videos/534/implementing-and-understanding-facebook-analytics-for-apps)
 * [Build Better Experiences with Facebook Analytics for Apps](https://developers.facebooklive.com/videos/580/build-better-experiences-with-facebook-analytics-for-apps)

[facebook_js]: https://developers.facebook.com/docs/javascript/reference/v2.3
[user_feed_docs]: https://developers.facebook.com/docs/graph-api/reference/v2.3/user/feed/