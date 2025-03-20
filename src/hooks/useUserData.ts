import { createClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
            const bucketName = 'MultiMedia Bucket';
            const newFilePath = `${userId}/profile.JPG`;
            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(newFilePath);

            return { ...user, profilePicture: data.publicUrl };
        },
    });
};