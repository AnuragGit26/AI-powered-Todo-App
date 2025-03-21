import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const storageUtils = {
    /**
     * Encode data before storing in localStorage
     * @param data Any JSON serializable data
     * @returns Encoded string
     */
    encode: (data: any): string => {
        try {
            // Create a salt based on current timestamp
            const salt = new Date().getTime().toString(36);

            // Stringify and encode the data with salt
            const jsonString = JSON.stringify(data);
            const encoded = btoa(`${salt}:${jsonString}`);

            return encoded;
        } catch (error) {
            console.error('Error encoding data:', error);
            return JSON.stringify(data); // Fallback to regular JSON
        }
    },

    /**
     * Decode data retrieved from localStorage
     * @param encodedData The encoded string
     * @returns Decoded data object or null if invalid
     */
    decode: <T>(encodedData: string): T | null => {
        try {
            // Decode the data and extract the original JSON
            const decoded = atob(encodedData);
            const [, jsonString] = decoded.split(':', 2);

            return JSON.parse(jsonString) as T;
        } catch (error) {
            console.error('Error decoding data:', error);
            return null;
        }
    },

    /**
     * Save data to localStorage with encoding
     * @param key localStorage key
     * @param data Data to store
     */
    setItem: (key: string, data: any): void => {
        const encodedData = storageUtils.encode(data);
        localStorage.setItem(key, encodedData);
    },

    /**
     * Get and decode data from localStorage
     * @param key localStorage key
     * @returns Decoded data or null if not found/invalid
     */
    getItem: <T>(key: string): T | null => {
        const encodedData = localStorage.getItem(key);
        if (!encodedData) return null;

        return storageUtils.decode<T>(encodedData);
    },

    /**
     * Get the current authenticated user's ID for namespacing storage
     * @returns User ID or null if not authenticated
     */
    async getUserNamespace(): Promise<string | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    /**
     * Save data to localStorage with user-specific namespace
     * @param key Base key name
     * @param data Data to store
     */
    async setUserItem(key: string, data: any): Promise<void> {
        const userId = await this.getUserNamespace();
        const namespaceKey = userId ? `${userId}:${key}` : key;
        this.setItem(namespaceKey, data);
    },

    /**
     * Get user-specific data from localStorage
     * @param key Base key name
     * @returns Decoded data or null if not found/invalid
     */
    async getUserItem<T>(key: string): Promise<T | null> {
        const userId = await this.getUserNamespace();
        const namespaceKey = userId ? `${userId}:${key}` : key;
        return this.getItem<T>(namespaceKey);
    }
};

export default storageUtils;