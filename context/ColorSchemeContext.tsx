import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useColorScheme as useRNColorScheme, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLOR_SCHEME_KEY = "conpanion_color_scheme";

type ColorSchemePreference = "light" | "dark" | "system";

interface ColorSchemeContextType {
    colorScheme: ColorSchemeName;
    userPreference: ColorSchemePreference;
    setColorScheme: (preference: ColorSchemePreference) => Promise<void>;
    isSystem: boolean;
    isLoaded: boolean;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

interface ColorSchemeProviderProps {
    children: ReactNode;
}

export function ColorSchemeProvider({ children }: ColorSchemeProviderProps) {
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
    const savePreference = useCallback(async (preference: ColorSchemePreference) => {
        try {
            setUserPreference(preference);
            await AsyncStorage.setItem(COLOR_SCHEME_KEY, preference);
        } catch (error) {
            console.error("Error saving color scheme preference:", error);
        }
    }, []);

    // Calculate the effective color scheme
    const getEffectiveColorScheme = useCallback((): ColorSchemeName => {
        if (userPreference === "system") {
            return systemColorScheme ?? "light";
        }
        return userPreference;
    }, [userPreference, systemColorScheme]);

    // Memoize the context value
    const contextValue = useMemo(() => {
        const effectiveColorScheme = getEffectiveColorScheme();

        return {
            colorScheme: effectiveColorScheme,
            userPreference,
            setColorScheme: savePreference,
            isSystem: userPreference === "system",
            isLoaded,
        };
    }, [userPreference, getEffectiveColorScheme, savePreference, isLoaded]);

    return <ColorSchemeContext.Provider value={contextValue}>{children}</ColorSchemeContext.Provider>;
}

export function useColorScheme() {
    const context = useContext(ColorSchemeContext);
    if (context === undefined) {
        throw new Error("useColorScheme must be used within a ColorSchemeProvider");
    }

    // Return system scheme until loaded to prevent flash
    if (!context.isLoaded) {
        return {
            colorScheme: context.colorScheme,
            userPreference: "system" as ColorSchemePreference,
            setColorScheme: () => Promise.resolve(), // Noop until loaded
            isSystem: true,
        };
    }

    return {
        colorScheme: context.colorScheme,
        userPreference: context.userPreference,
        setColorScheme: context.setColorScheme,
        isSystem: context.isSystem,
    };
}

// For backward compatibility, also export the effective color scheme directly
export function useEffectiveColorScheme(): ColorSchemeName {
    const { colorScheme } = useColorScheme();
    return colorScheme;
}
