import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: Platform.select({
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Notes",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="note.text" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="talks"
                options={{
                    title: "Talks",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="list.bullet"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
