import React, { useState, useEffect, useRef } from 'react';
import { createClient } from "@supabase/supabase-js";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getUserRegion } from '../hooks/getUserRegion';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const UserProfile: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [newUsername, setNewUsername] = useState<string>('');
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
    const phoneInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setUpdateSuccess(false);
            setUpdateError(null);

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);
                    setEmail(user.email || '');
                    const storedUsername = localStorage.getItem('username') || '';
                    setUsername(storedUsername);
                    setNewUsername(storedUsername);
                    setPhoneNumber(user.phone || '');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    };

    const handleUpdateProfile = async () => {
        setUpdateError(null);
        setUpdateSuccess(false);

        // Manual phone number validation
        if (phoneInputRef.current && !phoneInputRef.current.checkValidity()) {
            setUpdateError("Invalid phone number format. It should include country code and exactly 10 digits.");
            return;
        }

        try {
            // Fetch location before updating profile
            const { region, location } = await getUserRegion();
            const { data, error } = await supabase
                .from('profiles')
                .upsert([
                    {
                        user_id: userId,
                        username: newUsername,
                        updated_at: new Date(),
                        user_region: region,
                        location,
                        phone_number: phoneNumber,
                    },
                ], { onConflict: 'user_id' });

            if (error) {
                console.error("Error updating profile:", error);
                setUpdateError("Failed to update profile. Please try again.");
            } else {
                console.log("Profile updated successfully:", data);
                setUsername(newUsername);
                localStorage.setItem('username', newUsername);
                setUpdateSuccess(true);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setUpdateError("An unexpected error occurred. Please try again later.");
        }
        try {
            const { data, error } = await supabase.rpc('update_user_info', {
                user_id: userId,
                new_name: username,
                new_phone: phoneNumber,
                updated_at: new Date(),
            });
            if (error) {
                console.error('Error updating user:', error);
            } else {
                console.log('User updated successfully:', data);
            }
            if(data){
                console.log("AUTH updated successfully:", data);
            }
            if(error){
                console.log("AUTH update error:", error);
            }
        }
        catch (error) {
            console.error("Error updating profile:", error);
            setUpdateError("An unexpected error occurred. Please try again later.");}
    };

    if (loading) {
        return <div className='justify-center p-10'>Loading profile...</div>;
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">User Profile</h2>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                    Email:
                </label>
                <Input
                    type="email"
                    id="email"
                    value={email}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    disabled
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="username">
                    Username:
                </label>
                <Input
                    type="text"
                    id="username"
                    value={newUsername}
                    onChange={handleUsernameChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="phone-number">
                    Phone No.:
                </label>
                <Input
                    type="tel"
                    id="phone-number"
                    ref={phoneInputRef}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (e.g., +911234567890)"
                    pattern="^\+\d{1,3}\d{10}$"
                    title="Phone number must start with a country code and have exactly 10 digits after it (e.g., +1231234567890)"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
            </div>
            <div className="mb-6">
                <Button onClick={handleUpdateProfile} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Update Profile
                </Button>
                {updateError && (
                    <p className="text-red-500 text-s  mt-2">{updateError}</p>
                )}
                {updateSuccess && (
                    <p className="text-green-500 text-s  mt-2">Profile updated successfully!</p>
                )}
            </div>
        </div>
    );
};

export default UserProfile;