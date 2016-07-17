#import "PluginManager.h"
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKShareKit/FBSDKGameRequestDialog.h>
#import <FBSDKShareKit/FBSDKSharing.h>

@interface FacebookPlugin : GCPlugin<FBSDKGameRequestDialogDelegate, FBSDKSharingDelegate> {
    bool frictionlessRequestsEnabled;
}

@property (assign) NSNumber * loginRequestId;
@property (assign) NSNumber * requestId;
@property (assign) TeaLeafViewController *tealeafViewController;

@end

