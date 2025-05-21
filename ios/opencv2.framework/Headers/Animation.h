//
// This file is auto-generated. Please don't modify it!
//
#pragma once

#ifdef __cplusplus
//#import "opencv.hpp"
#import "opencv2/imgcodecs.hpp"
#else
#define CV_EXPORTS
#endif

#import <Foundation/Foundation.h>


@class IntVector;
@class Mat;
@class Scalar;



NS_ASSUME_NONNULL_BEGIN

// C++: class Animation
/**
 * Represents an animation with multiple frames.
 * The `Animation` struct is designed to store and manage data for animated sequences such as those from animated formats (e.g., GIF, AVIF, APNG, WebP).
 * It provides support for looping, background color settings, frame timing, and frame storage.
 *
 * Member of `Imgcodecs`
 */
CV_EXPORTS @interface Animation : NSObject


#ifdef __cplusplus
@property(readonly)cv::Ptr<cv::Animation> nativePtr;
#endif

#ifdef __cplusplus
- (instancetype)initWithNativePtr:(cv::Ptr<cv::Animation>)nativePtr;
+ (instancetype)fromNative:(cv::Ptr<cv::Animation>)nativePtr;
#endif


#pragma mark - Methods


    //
    // C++: int cv::Animation::loop_count
    //

@property int loop_count;

    //
    // C++: Scalar cv::Animation::bgcolor
    //

@property Scalar* bgcolor;

    //
    // C++: vector_int cv::Animation::durations
    //

@property IntVector* durations;

    //
    // C++: vector_Mat cv::Animation::frames
    //

@property Mat* frames;


@end

NS_ASSUME_NONNULL_END


