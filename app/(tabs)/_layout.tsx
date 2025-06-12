import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, Keyboard } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();
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
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: Platform.select({
                    ios: {},
                    android: isKeyboardVisible ? { display: "none" } : {},
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Notes",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="note.text" color={color} />,
                }}
            />
            <Tabs.Screen
                name="talks"
                options={{
                    title: "Talks",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
                }}
            />
            <Tabs.Screen
                name="conferences"
                options={{
                    title: "Conferences",
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                }}
            />
        </Tabs>
    );
}
