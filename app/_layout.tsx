import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AppProvider } from "@/context/AppContext";
import { ImageTransformProvider } from "@/context/ImageTransformContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync().catch(console.error);
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AppProvider>
                <ImageTransformProvider>
                    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="+not-found" />
                            <Stack.Screen
                                name="talk"
                                options={{
                                    headerShown: false,
                                    headerTitle: "Talk Details",
                                    headerBackTitle: "Back",
                                }}
                            />
                            <Stack.Screen
                                name="conference"
                                options={{
                                    headerShown: true,
                                    headerTitle: "Conference Details",
                                    headerBackTitle: "Back",
                                }}
                            />
                            <Stack.Screen name="modals/new-talk" options={{ presentation: "modal" }} />
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
                        </Stack>
                        <StatusBar style="auto" />
                    </ThemeProvider>
                </ImageTransformProvider>
            </AppProvider>
        </GestureHandlerRootView>
    );
}
