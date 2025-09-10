import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Keyboard } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useI18n } from "@/hooks/useI18n";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TabLayout() {
    const iconHighlightColor = useThemeColor({}, "iconHighlight");
    const headerBackgroundColor = useThemeColor({}, "headerBackground");

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
                tabBarActiveTintColor: iconHighlightColor,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: [
                    Platform.select({
                        android: isKeyboardVisible ? { display: "none" } : {},
                    }),
                    { backgroundColor: headerBackgroundColor },
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
                name="conferences"
                options={{
                    title: t("navigation.tabs.conferences"),
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
            />
        </Tabs>
    );
}
