#import "PluginManager.h"
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKShareKit/FBSDKGameRequestDialog.h>

@interface FacebookPlugin : GCPlugin<FBSDKGameRequestDialogDelegate> {
    bool frictionlessRequestsEnabled;
}

@property (assign) NSNumber * loginRequestId;
@property (assign) NSNumber * requestId;
@property (assign) TeaLeafViewController *tealeafViewController;

@end

