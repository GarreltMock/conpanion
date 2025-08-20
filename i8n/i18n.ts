import { I18n } from "i18n-js";
import * as Localization from "expo-localization";

// Import translation files
import de from "./locales/de.json";
import en from "./locales/en.json";

// Create the i18n instance
const i18n = new I18n({
    en,
    de,
});

// Set the locale based on device settings
i18n.locale = Localization.getLocales()[0].languageCode || "en";
console.log(Localization.getLocales());

// Fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export { i18n };
export default i18n;
