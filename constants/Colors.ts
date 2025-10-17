/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#cfff00";
const tintColorDark = "#cfff00";

export const Colors = {
    light: {
        text: "#11181C",
        background: "#fff",
        headerBackground: "#fafafa",
        highlight: "#11181C",
        tint: tintColorLight,
        tintContent: "#11181C",
        icon: "#687076",
        muted: "#687076",
        error: "#FF3B30",
        warning: "#FF9500",
        white: "#FFFFFF",
        border: "rgba(150, 150, 150, 0.3)",
        borderLight: "rgba(150, 150, 150, 0.2)",
        backgroundOverlay: "rgba(150, 150, 150, 0.1)",
        backgroundOverlayLight: "rgba(150, 150, 150, 0.05)",
    },
    dark: {
        text: "#ECEDEE",
        background: "#151718",
        headerBackground: "#121313",
        highlight: tintColorDark,
        tint: tintColorDark,
        tintContent: "#151718",
        icon: "#9298A1",
        muted: "#D0D3D6",
        error: "#FF453A",
        warning: "#FF9F0A",
        white: "#FFFFFF",
        border: "rgba(150, 150, 150, 0.4)",
        borderLight: "rgba(150, 150, 150, 0.3)",
        backgroundOverlay: "rgba(150, 150, 150, 0.15)",
        backgroundOverlayLight: "rgba(150, 150, 150, 0.08)",
    },
};
