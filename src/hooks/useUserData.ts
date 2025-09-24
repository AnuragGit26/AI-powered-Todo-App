import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { queryClient } from '../lib/queryClient';
import { useEffect } from 'react';

export interface UserData {
    id: string;
    username: string;
    email: string;
    bio: string;
    profilePicture: string;
    phoneNumber: string;
    location: string;
    userRegion: string;
}

/**
 * Helper function to get the profile picture URL with multiple extension fallbacks
 */
async function getProfilePictureUrl(userId: string): Promise<string> {
    const bucketName = 'MultiMedia Bucket';
    const commonExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

    const defaultExt = commonExtensions[0];
    const filePath = `${userId}/profile.${defaultExt}`;
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Fetches complete user data including profile information
 */
async function fetchUserData(): Promise<UserData> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('User not found');
    }

    // Fetch profile data from profiles table
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
    }

    const userId = user.id;
    const profilePictureUrl = await getProfilePictureUrl(userId);

    return {
        id: user.id,
        email: user.email || '',
        profilePicture: profilePictureUrl,
        bio: profileData?.bio || user.user_metadata?.bio || '',
        username: profileData?.username || user.user_metadata?.username || '',
        phoneNumber: profileData?.phone_number || user.phone || '',
        location: profileData?.location || '',
        userRegion: profileData?.user_region || 'US'
    };
}

export const useUserData = () => {
    const query = useQuery<UserData>({
        queryKey: ['userData'],
        queryFn: fetchUserData,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
        retry: 2,
    });

    // Centralized localStorage error handling
    const safeLocalStorage = (
        operation: 'set' | 'remove',
        key: string,
        value: string | undefined,
        isDev: boolean
    ) => {
        try {
            if (operation === 'set') {
                localStorage.setItem(key, value ?? '');
            } else {
                localStorage.removeItem(key);
            }
        } catch (err) {
            if (isDev) {
                console.error(`useUserData: Failed to ${operation === 'set' ? 'set' : 'remove'} localStorage key "${key}"`, err);
            }
        }
    };

    useEffect(() => {
        const data = query.data;
        const isDev = !import.meta.env.PROD;
        if (data) {
            safeLocalStorage('set', 'userId', data.id, isDev);
            safeLocalStorage('set', 'username', data.username, isDev);
            safeLocalStorage('set', 'profilePicture', data.profilePicture, isDev);
        } else {
            safeLocalStorage('remove', 'userId', undefined, isDev);
            safeLocalStorage('remove', 'username', undefined, isDev);
            safeLocalStorage('remove', 'profilePicture', undefined, isDev);
        }
    }, [query.data]);

    return query;
};

// Helper function to invalidate user data cache
export const invalidateUserData = () => {
    queryClient.invalidateQueries({ queryKey: ['userData'] });
};