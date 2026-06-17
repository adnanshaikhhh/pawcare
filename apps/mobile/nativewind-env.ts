// NativeWind v2 type augmentation for PawCare mobile.
//
// Why this file exists:
//  1. nativewind's own types.d.ts is in node_modules and is not auto-included
//     by tsc, so its `declare module "react-native" { ... }` augmentation never
//     reaches the type-check pass.
//  2. Even if it did, nativewind's bundled augmentation only covers
//     ViewProps / TextProps / ImagePropsBase / SwitchProps / FlatListProps /
//     TouchableWithoutFeedbackProps. It does NOT cover PressableProps or
//     TextInputProps, which the v2 mobile components (WeightGoalTracker,
//     QuickMoodFAB, StoriesCarousel) use heavily with className=.
//
// This file is a regular .ts file (not .d.ts) so the top-level import is a
// real module import. That makes the `declare module "react-native"` block
// below a true module augmentation (merged into the real module) rather than
// a shadow declaration that erases the original exports. The file is in the
// project's tsconfig include globs (**/*.ts), so tsc picks it up.
//
// The mobile tsconfig must NOT include "DOM" in its lib array \u2014 DOM and
// react-native both declare globals like Request, Response, Blob, etc. and
// the two collide. The base tsconfig already has skipLibCheck=true, and
// removing DOM from the mobile override is what makes this work cleanly.

import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
    tw?: string;
  }
  interface TextProps {
    className?: string;
    tw?: string;
  }
  interface ImagePropsBase {
    className?: string;
    tw?: string;
  }
  interface PressableProps {
    className?: string;
    tw?: string;
  }
  interface TextInputProps {
    className?: string;
    tw?: string;
  }
  interface SwitchProps {
    className?: string;
    tw?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
    tw?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
    tw?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
    tw?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
    tw?: string;
  }
  interface ScrollViewProps {
    className?: string;
    tw?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
    tw?: string;
  }
}
