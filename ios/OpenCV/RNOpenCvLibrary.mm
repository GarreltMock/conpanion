#import "RNOpenCvLibrary.h"
#import <React/RCTLog.h>
#import <opencv2/imgproc/imgproc.hpp>
#import <opencv2/core/core.hpp>
#import <opencv2/imgcodecs/ios.h>

@implementation RNOpenCvLibrary

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event %@ at %@", name, location);
}

RCT_EXPORT_METHOD(checkForBlurryImage:(NSString *)imageAsBase64 callback:(RCTResponseSenderBlock)callback) {
  UIImage* image = [self decodeBase64ToImage:imageAsBase64];
  BOOL isImageBlurryResult = [self isImageBlurry:image];
  
  id objects[] = { isImageBlurryResult ? @YES : @NO };
  NSUInteger count = sizeof(objects) / sizeof(id);
  NSArray *dataArray = [NSArray arrayWithObjects:objects
                                           count:count];
  
  callback(@[[NSNull null], dataArray]);
}

RCT_EXPORT_METHOD(preprocess:(NSString *)imageAsBase64
                  callback:(RCTResponseSenderBlock)callback)
{
  UIImage* image = [self decodeBase64ToImage:imageAsBase64];
  if (!image) {
    callback(@[@"Invalid image", [NSNull null]]);
    return;
  }
  cv::Mat src;
  UIImageToMat(image, src);

  int origWidth = src.cols;
  int origHeight = src.rows;

  cv::Mat resized;
  cv::resize(src, resized, cv::Size(256, 256), 0, 0, cv::INTER_LINEAR);

  cv::Mat floatImg;
  resized.convertTo(floatImg, CV_32FC3, 1.0 / 255.0);

  // Convert HWC to CHW
  std::vector<cv::Mat> channels(3);
  cv::split(floatImg, channels);
  std::vector<float> chwData;
  for (int c = 0; c < 3; ++c) {
    chwData.insert(chwData.end(), (float*)channels[c].datastart, (float*)channels[c].dataend);
  }

  NSData *data = [NSData dataWithBytes:chwData.data() length:chwData.size() * sizeof(float)];
  NSString *base64 = [data base64EncodedStringWithOptions:0];

  NSDictionary *result = @{
    @"data": base64,
    @"originalSize": @{@"width": @(origWidth), @"height": @(origHeight)}
  };
  callback(@[[NSNull null], result]);
}

RCT_EXPORT_METHOD(postprocessHeatmap:(NSString *)heatmapBase64
                  originalWidth:(nonnull NSNumber *)width
                  originalHeight:(nonnull NSNumber *)height
                  callback:(RCTResponseSenderBlock)callback)
{
  NSData *heatmapData = [[NSData alloc] initWithBase64EncodedString:heatmapBase64 options:0];
  if (!heatmapData) {
    callback(@[@"Invalid heatmap", [NSNull null]]);
    return;
  }
  int H = 256, W = 256, C = 4; // Assume 4 channels, 256x256
  const float *heatmapPtr = (const float *)heatmapData.bytes;

  NSMutableArray *polygon = [NSMutableArray array];

  for (int c = 0; c < C; ++c) {
    cv::Mat mat(H, W, CV_32F, (void*)(heatmapPtr + c * H * W));
    cv::Mat resized;
    cv::resize(mat, resized, cv::Size([width intValue], [height intValue]), 0, 0, cv::INTER_LINEAR);

    cv::Mat thresh;
    cv::threshold(resized, thresh, 0.3, 1.0, cv::THRESH_BINARY);

    cv::Mat binary;
    thresh.convertTo(binary, CV_8U, 255);

    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(binary, contours, cv::RETR_EXTERNAL, cv::CHAIN_APPROX_SIMPLE);

    double maxArea = 0;
    int maxIdx = -1;
    for (int i = 0; i < contours.size(); ++i) {
      double area = cv::contourArea(contours[i]);
      if (area > maxArea) {
        maxArea = area;
        maxIdx = i;
      }
    }
    if (maxIdx >= 0) {
      cv::Moments m = cv::moments(contours[maxIdx]);
      if (m.m00 != 0) {
        float cx = m.m10 / m.m00;
        float cy = m.m01 / m.m00;
        [polygon addObject:@[@(cx), @(cy)]];
      }
    }
  }
  callback(@[[NSNull null], polygon]);
}

- (cv::Mat)convertUIImageToCVMat:(UIImage *)image {
  CGColorSpaceRef colorSpace = CGImageGetColorSpace(image.CGImage);
  CGFloat cols = image.size.width;
  CGFloat rows = image.size.height;
  
  cv::Mat cvMat(rows, cols, CV_8UC4); // 8 bits per component, 4 channels (color channels + alpha)
  
  CGContextRef contextRef = CGBitmapContextCreate(cvMat.data,                 // Pointer to  data
                                                  cols,                       // Width of bitmap
                                                  rows,                       // Height of bitmap
                                                  8,                          // Bits per component
                                                  cvMat.step[0],              // Bytes per row
                                                  colorSpace,                 // Colorspace
                                                  kCGImageAlphaNoneSkipLast |
                                                  kCGBitmapByteOrderDefault); // Bitmap info flags
  
  CGContextDrawImage(contextRef, CGRectMake(0, 0, cols, rows), image.CGImage);
  CGContextRelease(contextRef);
  
  return cvMat;
}

- (UIImage *)decodeBase64ToImage:(NSString *)strEncodeData {
  NSData *data = [[NSData alloc]initWithBase64EncodedString:strEncodeData options:NSDataBase64DecodingIgnoreUnknownCharacters];
  return [UIImage imageWithData:data];
}

- (BOOL) isImageBlurry:(UIImage *) image {
  // converting UIImage to OpenCV format - Mat
  cv::Mat matImage = [self convertUIImageToCVMat:image];
  cv::Mat matImageGrey;
  // converting image's color space (RGB) to grayscale
  cv::cvtColor(matImage, matImageGrey, CV_BGR2GRAY);
  
  cv::Mat dst2 = [self convertUIImageToCVMat:image];
  cv::Mat laplacianImage;
  dst2.convertTo(laplacianImage, CV_8UC1);
  
  // applying Laplacian operator to the image
  cv::Laplacian(matImageGrey, laplacianImage, CV_8U);
  cv::Mat laplacianImage8bit;
  laplacianImage.convertTo(laplacianImage8bit, CV_8UC1);
  
  unsigned char *pixels = laplacianImage8bit.data;
  
  // 16777216 = 256*256*256
  int maxLap = -16777216;
  for (int i = 0; i < ( laplacianImage8bit.elemSize()*laplacianImage8bit.total()); i++) {
    if (pixels[i] > maxLap) {
      maxLap = pixels[i];
    }
  }
  // one of the main parameters here: threshold sets the sensitivity for the blur check
  // smaller number = less sensitive; default = 180
  int threshold = 180;
  
  return (maxLap <= threshold);
}

@end
