import { useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, type ViewProps } from "react-native";

export function MyKeyboardAvoidingView({ ...otherProps }: ViewProps) {
    const [keyboardKey, setKeyboardKey] = useState<number>(0);
    useEffect(() => {
        if (Platform.OS === "ios") return;

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardKey((prev) => prev + 1);
        });

        return () => {
            hideSub.remove();
        };
    }, []);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            key={keyboardKey}
            {...otherProps}
        />
    );
}
