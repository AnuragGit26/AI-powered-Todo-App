import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Helper function to get the profile picture URL with multiple extension fallbacks
 */
async function getProfilePictureUrl(userId: string): Promise<string> {
    const bucketName = 'MultiMedia Bucket';
    const commonExtensions = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

    // Since we can't directly check if the file exists in the storage bucket from the client,
    // we'll return the first URL format. The browser will handle the 404 if the image doesn't exist.
    const defaultExt = commonExtensions[0]; // 'jpg'
    const filePath = `${userId}/profile.${defaultExt}`;
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

export const useUserData = () => {
    return useQuery({
        queryKey: ['userData'],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not found');
            }

            const userId = user.id;
            const profilePictureUrl = await getProfilePictureUrl(userId);

            return { ...user, profilePicture: profilePictureUrl };
        },
    });
};