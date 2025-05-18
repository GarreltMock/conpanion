#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif

#import <opencv2/imgproc/imgproc.hpp>

@interface RNOpenCvLibrary : NSObject <RCTBridgeModule>

// Add these declarations for clarity
- (void)preprocess:(NSString *)imageAsBase64 callback:(RCTResponseSenderBlock)callback;
- (void)postprocessHeatmap:(NSString *)heatmapBase64
            originalWidth:(nonnull NSNumber *)width
           originalHeight:(nonnull NSNumber *)height
                 callback:(RCTResponseSenderBlock)callback;
- (void)transformImage:(NSString *)imageAsBase64
               corners:(NSArray *)corners
              callback:(RCTResponseSenderBlock)callback;

@end
