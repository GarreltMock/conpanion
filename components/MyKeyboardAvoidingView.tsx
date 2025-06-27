import { KeyboardAvoidingView, Platform, type ViewProps } from "react-native";

export function MyKeyboardAvoidingView({ children, style, ...otherProps }: ViewProps) {
    return (
        <KeyboardAvoidingView
            style={[{ flex: 1 }, style]}
            enabled={Platform.OS === "ios"}
            behavior="padding"
            {...otherProps}
        >
            {children}
        </KeyboardAvoidingView>
    );
}
