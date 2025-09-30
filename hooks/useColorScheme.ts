import { useState, useEffect } from "react";
import { useColorScheme as useRNColorScheme, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLOR_SCHEME_KEY = "conpanion_color_scheme";

type ColorSchemePreference = "light" | "dark" | "system";

export function useColorScheme() {
    const systemColorScheme = useRNColorScheme();
    const [userPreference, setUserPreference] = useState<ColorSchemePreference>("system");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load user preference from storage on mount
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const saved = await AsyncStorage.getItem(COLOR_SCHEME_KEY);
                if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
                    setUserPreference(saved as ColorSchemePreference);
                }
            } catch (error) {
                console.error("Error loading color scheme preference:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadPreference();
    }, []);

    // Save preference to storage when it changes
    const savePreference = async (preference: ColorSchemePreference) => {
        try {
            await AsyncStorage.setItem(COLOR_SCHEME_KEY, preference);
            setUserPreference(preference);
        } catch (error) {
            console.error("Error saving color scheme preference:", error);
        }
    };

    // Calculate the effective color scheme
    const getEffectiveColorScheme = (): ColorSchemeName => {
        if (userPreference === "system") {
            return systemColorScheme ?? "light";
        }
        return userPreference;
    };

    // Return system scheme until loaded to prevent flash
    if (!isLoaded) {
        return systemColorScheme ?? "light";
    }

    return {
        colorScheme: getEffectiveColorScheme(),
        userPreference,
        setColorScheme: savePreference,
        isSystem: userPreference === "system",
    };
}

// For backward compatibility, also export the effective color scheme directly
export function useEffectiveColorScheme(): ColorSchemeName {
    const result = useColorScheme();
    if (typeof result === "string") {
        return result;
    }
    return result.colorScheme;
}
