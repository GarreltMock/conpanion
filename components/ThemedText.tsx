import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({ style, lightColor, darkColor, type = "default", ...rest }: ThemedTextProps) {
    // Use text color by default, but use tint color for links
    const colorKey = type === "link" ? "tint" : "text";
    const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

    return (
        <Text
            style={[
                { color },
                type === "default" ? styles.default : undefined,
                type === "title" ? styles.title : undefined,
                type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
                type === "subtitle" ? styles.subtitle : undefined,
                type === "link" ? styles.link : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: "MuseoSans-Medium",
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
        fontFamily: "MuseoSans-Bold",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 32,
        fontFamily: "MuseoSans-Bold",
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "MuseoSans-Bold",
    },
    link: {
        lineHeight: 30,
        fontSize: 16,
        fontFamily: "MuseoSans-Medium",
        // This color will be overridden by the useThemeColor in light/dark mode
    },
});
