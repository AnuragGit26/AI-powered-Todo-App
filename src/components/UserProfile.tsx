import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getUserRegion } from '../hooks/getUserRegion';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfilePictureUploader from './UserProfilePictureUploader';
import Loader from './ui/Loader.jsx';
import { logActivity, updateUsageMetrics } from '../services/activityMetrics';

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
    const [showUploader, setShowUploader] = useState<boolean>(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [usageMetrics, setUsageMetrics] = useState<Record<string, any> | null>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

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
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!userId) return;
        const fetchActivityLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('user_id', userId)
                    .order('timestamp', { ascending: false })
                    .limit(5);
                if (error) throw error;
                setActivityLogs(data);
            } catch (error) {
                console.error('Error fetching activity logs:', error);
            }
        };

        const fetchUsageMetrics = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_stats')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                if (error) throw error;
                setUsageMetrics(data);
            } catch (error) {
                console.error('Error fetching usage metrics:', error);
            }
        };

        fetchActivityLogs();
        fetchUsageMetrics();
    }, [userId]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUsername(e.target.value);
    };

    const handleUpdateProfile = async () => {
        setUpdateError(null);
        setUpdateSuccess(false);

        if (phoneInputRef.current && !phoneInputRef.current.checkValidity()) {
            setUpdateError('Invalid phone number format. It should include country code and exactly 10 digits.');
            return;
        }

        try {
            const { region, location } = await getUserRegion();
            const { error } = await supabase
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
                setUpdateError('Failed to update profile. Please try again.');
            } else {
                setUsername(newUsername);
                localStorage.setItem('username', newUsername);
                setUpdateSuccess(true);
                // Log profile update activity and update changes count
                await logActivity(userId, 'User updated profile');
                await updateUsageMetrics(userId, { changes_count_inc: 1 });
            }
        } catch (error) {
            setUpdateError('An unexpected error occurred. Please try again later.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center w-screen h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
            <div className="fixed top-4 right-4 z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                >
                    <Home className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </motion.button>
            </div>
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
                    pattern="^\\+\\d{1,3}\\d{10}$"
                    title="Phone number must start with a country code and have exactly 10 digits after it (e.g., +1231234567890)"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
            </div>
            <div className="mb-6">
                <Button
                    onClick={handleUpdateProfile}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Update Profile
                </Button>
                {updateError && (
                    <p className="text-red-500 text-s mt-2">{updateError}</p>
                )}
                {updateSuccess && (
                    <p className="text-green-500 text-s mt-2">Profile updated successfully!</p>
                )}
            </div>
            <div className="mb-6">
                <Button
                    onClick={() => setShowUploader(true)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Change Profile Picture
                </Button>
            </div>
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Account Activity
                </h3>
                {activityLogs.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                        {activityLogs.map((log, index) => (
                            <li key={index}>
                                {log.activity} on {new Date(log.timestamp).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity.</p>
                )}
            </div>
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Usage Metrics
                </h3>
                {usageMetrics ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        <p>Last Login: {new Date(usageMetrics.last_login).toLocaleString()}</p>
                        <p>Total Logins: {usageMetrics.total_logins}</p>
                        <p>Changes Made: {usageMetrics.changes_count}</p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No usage metrics available.</p>
                )}
            </div>
            <AnimatePresence>
                {showUploader && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto p-6 relative"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                        >
                            <Button
                                onClick={() => setShowUploader(false)}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white p-2"
                            >
                                <X className="h-5 w-5 text-white" />
                            </Button>
                            <UserProfilePictureUploader onUploadSuccess={() => setShowUploader(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;