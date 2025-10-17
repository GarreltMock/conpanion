import React, { useState } from "react";
import { StyleSheet, View, TextInput, TouchableOpacity, Keyboard, ActivityIndicator, Text } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ModalView } from "@/components/ModalView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useApp } from "@/context/AppContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewTalkModal() {
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const { createTalk } = useApp();
    const { t } = useI18n();
    const textColor = useThemeColor({}, "text");
    const tintColor = useThemeColor({}, "tint");
    const tintContentColor = useThemeColor({}, "tintContent");
    const borderLight = useThemeColor({}, "borderLight");
    const border = useThemeColor({}, "border");

    const handleCreate = async () => {
        if (!title.trim()) {
            toast.error(t("forms.talk.titleRequired"));
            return;
        }

        try {
            setIsCreating(true);
            Keyboard.dismiss();

            console.log("About to create talk with title:", title.trim());
            await createTalk(title.trim());
            console.log("Talk created successfully");

            router.back();
        } catch (error) {
            console.error("Error creating talk:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create talk. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ModalView style={styles.container}>
                <View style={[styles.header, { borderBottomColor: borderLight }]}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={isCreating}>
                        <ThemedText style={styles.cancelText}>{t("common.cancel")}</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.title}>{t("modals.newTalk")}</ThemedText>

                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            { backgroundColor: tintColor },
                            !title.trim() && styles.disabledButton,
                        ]}
                        onPress={handleCreate}
                        disabled={!title.trim() || isCreating}
                    >
                        {isCreating ? (
                            <ActivityIndicator size="small" color={tintContentColor} />
                        ) : (
                            <Text style={[styles.createText, { color: tintContentColor }]}>
                                {t("common.actions.create")}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                    <View style={[styles.inputContainer, { borderColor: border }]}>
                        <IconSymbol name="mic.fill" size={22} color={textColor + "80"} style={styles.inputIcon} />

                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder={t("forms.talk.titlePlaceholder")}
                            placeholderTextColor={textColor + "60"}
                            value={title}
                            onChangeText={setTitle}
                            autoFocus
                            maxLength={100}
                            returnKeyType="done"
                            onSubmitEditing={title.trim() ? handleCreate : undefined}
                        />
                    </View>

                    <ThemedText style={styles.helpText}>{t("help.keepTakingNotes")}</ThemedText>
                </View>
            </ModalView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: "600",
    },
    cancelButton: {
        padding: 8,
    },
    cancelText: {
        fontSize: 17,
    },
    createButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createText: {
        fontSize: 17,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.5,
    },
    formContainer: {
        padding: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    helpText: {
        fontSize: 14,
        opacity: 0.6,
        lineHeight: 20,
    },
});
