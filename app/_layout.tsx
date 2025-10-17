import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

import { ColorSchemeProvider, useColorScheme } from "@/context/ColorSchemeContext";
import { I18nProvider } from "@/context/I18nContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { AppProvider } from "@/context/AppContext";
import { useAppStartup } from "@/hooks/useAppStartup";
import { setupGlobalErrorHandler } from "@/utils/errorHandler";

function AppContent() {
    const { colorScheme } = useColorScheme();

    const invertedBackgroundColor = useThemeColor({}, "background", true);
    const invertedBorderColor = useThemeColor({}, "border", true);
    const invertedTextColor = useThemeColor({}, "text", true);
    const invertedMutedColor = useThemeColor({}, "muted", true);
    const invertedIconHighlightColor = useThemeColor({}, "highlight", true);
    const invertedErrorColor = useThemeColor({}, "error", true);
    const whiteColor = useThemeColor({}, "white");

    // Run centralized app startup logic
    useAppStartup();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, animation: "fade", animationDuration: 100 }}
                />
                <Stack.Screen name="+not-found" />
                <Stack.Screen
                    name="talk"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="conference-list"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="conference-details"
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
                <Stack.Screen name="modals/new-talk" options={{ presentation: "modal", headerShown: false }} />
                <Stack.Screen name="modals/new-agenda-item" options={{ presentation: "modal", headerShown: false }} />
                <Stack.Screen
                    name="modals/settings"
                    options={{
                        presentation: "modal",
                        headerShown: false,
                        animation: "slide_from_bottom",
                    }}
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
                    }}
                />
                <Stack.Screen
                    name="modals/map-view"
                    options={{
                        presentation: "modal",
                        headerShown: false,
                        animation: "slide_from_bottom",
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
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="modals/export-options"
                    options={{
                        presentation: "modal",
                        title: "Export Conference",
                        headerShown: false,
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
                <Stack.Screen
                    name="modals/webview"
                    options={{
                        presentation: "modal",
                        headerShown: false,
                        title: "Web View",
                    }}
                />
            </Stack>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Toaster
                position="bottom-center"
                theme={colorScheme === "dark" ? "dark" : "light"}
                icons={{
                    success: <IconSymbol name="checkmark.circle.fill" size={20} color={invertedIconHighlightColor} />,
                    error: <IconSymbol name="xmark.circle.fill" size={20} color={invertedErrorColor} />,
                    warning: <IconSymbol name="exclamationmark.triangle.fill" size={20} color={invertedErrorColor} />,
                    info: <IconSymbol name="info.circle.fill" size={20} color={invertedIconHighlightColor} />,
                }}
                swipeToDismissDirection="left"
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
                        color: invertedMutedColor,
                        fontSize: 14,
                        fontFamily: "MuseoSans-Light",
                    },
                    actionButtonStyle: {
                        backgroundColor: invertedErrorColor,
                        borderWidth: 0,
                    },
                    actionButtonTextStyle: {
                        color: whiteColor,
                    },
                    cancelButtonTextStyle: {
                        color: invertedTextColor,
                    },
                }}
            />
        </ThemeProvider>
    );
}

export default function RootLayout() {
    // Setup global error handler on app load
    setupGlobalErrorHandler();

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

    if (!loaded) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <I18nProvider>
                    <ColorSchemeProvider>
                        <AppProvider>
                            <AppContent />
                        </AppProvider>
                    </ColorSchemeProvider>
                </I18nProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
