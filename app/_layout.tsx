import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AppProvider } from "@/context/AppContext";
import { trackAppStart } from "@/utils/analytics";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const invertedBackgroundColor = useThemeColor({}, "background", true);
    const invertedBorderColor = useThemeColor({}, "border", true);
    const invertedTextColor = useThemeColor({}, "text", true);
    const invertedTabIconColor = useThemeColor({}, "tabIconDefault", true);
    const invertedTintColor = useThemeColor({}, "tint", true);
    const invertedBackgroundOverlayColor = useThemeColor({}, "backgroundOverlay", true);
    const invertedErrorColor = useThemeColor({}, "error", true);
    const invertedWarningColor = useThemeColor({}, "warning", true);

    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
        "MuseoSans-Thin": require("../assets/fonts/MuseoSans-Thin.ttf"),
        "MuseoSans-ThinItalic": require("../assets/fonts/MuseoSans-ThinItalic.ttf"),
        "MuseoSans-Light": require("../assets/fonts/MuseoSans-Light.ttf"),
        "MuseoSans-LightItalic": require("../assets/fonts/MuseoSans-LightItalic.ttf"),
        "MuseoSans-Medium": require("../assets/fonts/MuseoSans-Medium.ttf"),
        "MuseoSans-MediumItalic": require("../assets/fonts/MuseoSans-MediumItalic.ttf"),
        "MuseoSans-Bold": require("../assets/fonts/MuseoSans-Bold.ttf"),
        "MuseoSans-BoldItalic": require("../assets/fonts/MuseoSans-BoldItalic.ttf"),
        "MuseoSans-Black": require("../assets/fonts/MuseoSans-Black.ttf"),
        "MuseoSans-BlackItalic": require("../assets/fonts/MuseoSans-BlackItalic.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync().catch(console.error);
            // Track app start
            trackAppStart().catch(console.error);
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <AppProvider>
                    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                            <Stack.Screen
                                name="talk"
                                options={{
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="conference"
                                options={{
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="image-edit"
                                options={{
                                    headerShown: false,
                                    title: "Edit Image",
                                }}
                            />
                            <Stack.Screen
                                name="modals/new-talk"
                                options={{ presentation: "modal", headerShown: false }}
                            />
                            <Stack.Screen
                                name="modals/new-agenda-talk"
                                options={{ presentation: "modal", headerShown: false }}
                            />
                            <Stack.Screen
                                name="modals/edit-note"
                                options={{
                                    presentation: "transparentModal",
                                    headerShown: false,
                                    animation: "fade_from_bottom",
                                }}
                            />
                            <Stack.Screen
                                name="modals/image-view"
                                options={{
                                    presentation: "modal",
                                    headerShown: false,
                                    animation: "fade",
                                }}
                            />
                            <Stack.Screen
                                name="modals/new-conference"
                                options={{
                                    headerShown: false,
                                    presentation: "modal",
                                    title: "New Conference",
                                }}
                            />
                            <Stack.Screen
                                name="modals/edit-conference"
                                options={{
                                    presentation: "modal",
                                    title: "Edit Conference",
                                }}
                            />
                            <Stack.Screen
                                name="modals/export-options"
                                options={{
                                    presentation: "modal",
                                    title: "Export Conference",
                                }}
                            />
                            <Stack.Screen
                                name="modals/talk-evaluation"
                                options={{
                                    presentation: "transparentModal",
                                    headerShown: false,
                                    animation: "fade_from_bottom",
                                }}
                            />
                        </Stack>
                        <StatusBar style="auto" />
                    </ThemeProvider>
                </AppProvider>
                <Toaster
                    position="bottom-center"
                    theme={colorScheme === "dark" ? "dark" : "light"}
                    icons={{
                        success: <IconSymbol name="checkmark.circle.fill" size={20} color={invertedTintColor} />,
                        error: <IconSymbol name="xmark.circle.fill" size={20} color={invertedErrorColor} />,
                        warning: (
                            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={invertedWarningColor} />
                        ),
                        info: <IconSymbol name="info.circle.fill" size={20} color={invertedTintColor} />,
                    }}
                    toastOptions={{
                        style: {
                            backgroundColor: invertedBackgroundColor,
                            borderColor: invertedBorderColor,
                            borderWidth: 1,
                        },
                        titleStyle: {
                            color: invertedTextColor,
                            fontSize: 16,
                            fontFamily: "MuseoSans-Medium",
                        },
                        descriptionStyle: {
                            color: invertedTabIconColor,
                            fontSize: 14,
                            fontFamily: "MuseoSans-Light",
                        },
                        actionButtonStyle: {
                            backgroundColor: invertedTintColor,
                        },
                        cancelButtonStyle: {
                            backgroundColor: invertedBackgroundOverlayColor,
                        },
                    }}
                />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
