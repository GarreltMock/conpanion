import AsyncStorage from "@react-native-async-storage/async-storage";

const MIGRATIONS_KEY = "app_migrations_completed";

/**
 * Check if a specific migration has been completed
 */
export const hasMigrationRun = async (migrationId: string): Promise<boolean> => {
    try {
        const completedMigrations = await AsyncStorage.getItem(MIGRATIONS_KEY);
        if (!completedMigrations) return false;

        const migrations = JSON.parse(completedMigrations) as string[];
        return migrations.includes(migrationId);
    } catch (error) {
        console.error("Error checking migration status:", error);
        return false;
    }
};

/**
 * Mark a migration as completed
 */
export const markMigrationComplete = async (migrationId: string): Promise<void> => {
    try {
        const completedMigrations = await AsyncStorage.getItem(MIGRATIONS_KEY);
        const migrations = completedMigrations ? (JSON.parse(completedMigrations) as string[]) : [];

        if (!migrations.includes(migrationId)) {
            migrations.push(migrationId);
            await AsyncStorage.setItem(MIGRATIONS_KEY, JSON.stringify(migrations));
            console.log(`[Migration] Marked '${migrationId}' as complete`);
        }
    } catch (error) {
        console.error("Error marking migration as complete:", error);
    }
};

/**
 * Run a migration function if it hasn't been run before
 */
export const runMigration = async (
    migrationId: string,
    migrationFn: () => Promise<void>
): Promise<void> => {
    const hasRun = await hasMigrationRun(migrationId);

    if (hasRun) {
        console.log(`[Migration] Skipping '${migrationId}' - already completed`);
        return;
    }

    console.log(`[Migration] Running '${migrationId}'...`);

    try {
        await migrationFn();
        await markMigrationComplete(migrationId);
        console.log(`[Migration] Successfully completed '${migrationId}'`);
    } catch (error) {
        console.error(`[Migration] Failed to run '${migrationId}':`, error);
        throw error;
    }
};
