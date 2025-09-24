import { supabase } from './supabaseClient';

export const storageUtils = {
    encode: (data: unknown): string => {
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

    setItem: (key: string, data: unknown): void => {
        const encodedData = storageUtils.encode(data);
        localStorage.setItem(key, encodedData);
    },

    getItem: <T>(key: string): T | null => {
        const encodedData = localStorage.getItem(key);
        if (!encodedData) return null;

        return storageUtils.decode<T>(encodedData);
    },

    async getUserNamespace(): Promise<string | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async setUserItem(key: string, data: unknown): Promise<void> {
        const userId = await this.getUserNamespace();
        const namespaceKey = userId ? `${userId}:${key}` : key;
        this.setItem(namespaceKey, data);
    },

    async getUserItem<T>(key: string): Promise<T | null> {
        const userId = await this.getUserNamespace();
        const namespaceKey = userId ? `${userId}:${key}` : key;
        return this.getItem<T>(namespaceKey);
    }
};

export default storageUtils;