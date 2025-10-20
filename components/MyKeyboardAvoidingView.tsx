import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Keyboard, type ViewProps } from "react-native";

export function MyKeyboardAvoidingView({ children, style, ...otherProps }: ViewProps) {
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        if (Platform.OS !== "android") return;

        const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
        });

        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return (
        <KeyboardAvoidingView
            style={[{ flex: 1 }, style]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
            enabled={Platform.OS === "ios" || keyboardVisible}
            {...otherProps}
        >
            {children}
        </KeyboardAvoidingView>
    );
}
