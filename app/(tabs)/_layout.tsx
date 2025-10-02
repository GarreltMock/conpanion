import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Keyboard } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TabLayout() {
    const highlightColor = useThemeColor({}, "highlight");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");
    const borderLightColor = useThemeColor({}, "borderLight");

    const { t } = useI18n();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidHideListener?.remove();
            keyboardDidShowListener?.remove();
        };
    }, []);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: highlightColor,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: [
                    Platform.select({
                        android: isKeyboardVisible ? { display: "none" } : {},
                    }),
                    { backgroundColor: headerBackgroundColor, borderTopColor: borderLightColor, borderTopWidth: 1 },
                ],
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t("navigation.tabs.notes"),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="note.text" color={color} />,
                }}
            />
            <Tabs.Screen
                name="talks"
                options={{
                    title: t("navigation.tabs.talks"),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
                }}
            />
            <Tabs.Screen
                name="conference"
                options={{
                    title: t("navigation.tabs.conference"),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
            />
        </Tabs>
    );
}
