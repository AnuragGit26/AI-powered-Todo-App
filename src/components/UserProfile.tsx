import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Label } from './ui/label';
import { getUserRegion } from '../hooks/getUserRegion';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, X, User, Activity, BarChart3, CreditCard, Shield,
    Camera, Monitor, Smartphone, Tablet, LogIn, LogOut, Edit,
    FileEdit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfilePictureUploader from './UserProfilePictureUploader';
import Loader from './ui/Loader.jsx';
import { logActivity, updateUsageMetrics } from '../services/activityMetrics';
import { fetchUserSessions, terminateSession, UserSession } from '../lib/sessionUtils';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserProfileProps {
    // Optional props can be added here if needed in the future
}

interface UserData {
    userId: string;
    username?: string;
    email?: string;
    bio?: string;
    profilePicture?: string;
}

const UserProfile: React.FC<UserProfileProps> = () => {
    const [, setUsername] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [userData, setUserData] = useState<UserData | null>(null);
    const userId = userData?.userId || localStorage.getItem('userId');
    const [loading, setLoading] = useState<boolean>(true);
    const [newUsername, setNewUsername] = useState<string>('');
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
    const [showUploader, setShowUploader] = useState<boolean>(false);
    const [activityLogs, setActivityLogs] = useState<Array<{ activity: string, timestamp: string }>>([]);
    const [usageMetrics, setUsageMetrics] = useState<Record<string, unknown> | null>(null);
    const [bio, setBio] = useState<string>('');
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setUpdateSuccess(false);
            setUpdateError(null);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Also fetch profile data from profiles table
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    // Use bio from user metadata if it exists, otherwise use from profiles table
                    const userBio = user.user_metadata?.bio || (profileData && profileData.bio) || '';

                    setUserData({
                        userId: user.id,
                        email: user.email || '',
                        username: localStorage.getItem('username') || '',
                        bio: userBio,
                        profilePicture: localStorage.getItem('profilePicture') || user.user_metadata?.profile_picture || ''
                    });
                    setNewUsername(localStorage.getItem('username') || '');
                    setPhoneNumber(user.phone || '');
                    setProfilePicture(localStorage.getItem('profilePicture') || user.user_metadata?.profile_picture || '');
                    setBio(userBio);
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
                    .limit(7);
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

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBio(e.target.value);
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

            // First update the profile in the profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert([
                    {
                        user_id: userId,
                        username: newUsername,
                        bio: bio,
                        updated_at: new Date(),
                        user_region: region,
                        location,
                        phone_number: phoneNumber,
                    },
                ], { onConflict: 'user_id' });

            if (profileError) {
                setUpdateError('Failed to update profile. Please try again.');
                return;
            }

            // Also update the user metadata to store bio there
            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    bio: bio
                }
            });

            if (metadataError) {
                setUpdateError('Failed to update user metadata. Please try again.');
                return;
            }

            // Update local state
            setUserData(prev => prev ? {
                ...prev,
                username: newUsername,
                bio: bio
            } : null);
            localStorage.setItem('username', newUsername);
            setUpdateSuccess(true);

            // Log profile update activity and update changes count
            if (userId) {
                await logActivity(userId, 'User updated profile');
                await updateUsageMetrics(userId, { changes_count_inc: 1 });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setUpdateError('An unexpected error occurred. Please try again later.');
        }
    };

    const fetchSessions = async () => {
        if (!userId) return;

        setSessionLoading(true);
        setSessionError(null);

        try {
            const sessionsData = await fetchUserSessions(userId);
            setSessions(sessionsData);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            setSessionError('Failed to fetch active sessions. Please try again.');
        } finally {
            setSessionLoading(false);
        }
    };

    const handleTerminateSession = async (sessionId: string, isCurrent: boolean) => {
        try {
            await terminateSession(sessionId);

            if (isCurrent) {
                // If terminating current session, user will be signed out
                await supabase.auth.signOut();
                navigate('/login');
            } else {
                // Otherwise just refresh the sessions list
                fetchSessions();
            }
        } catch (error) {
            console.error('Error terminating session:', error);
            setSessionError('Failed to terminate session. Please try again.');
        }
    };

    useEffect(() => {
        if (userId) {
            fetchSessions();
        }
    }, [userId]);

    // Handle password change
    const handlePasswordChange = async () => {
        // Validate passwords
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError("New passwords don't match");
            return;
        }

        if (passwordData.new.length < 6) {
            setPasswordError("New password must be at least 6 characters");
            return;
        }

        setPasswordError(null);
        setPasswordSuccess(null);
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.new
            });

            if (error) throw error;

            setPasswordSuccess("Password updated successfully. You will be logged out.");
            setTimeout(() => {
                supabase.auth.signOut();
                navigate('/login');
            }, 2000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update password";
            setPasswordError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center w-screen h-screen">
                <Loader />
            </div>
        );
    }

    // Extract first letter of username for avatar fallback
    const nameInitial = newUsername ? newUsername.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-white/10 p-4 md:p-8">
            <div className="fixed top-4 right-4 z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition duration-300 ease-in-out border border-gray-200 dark:border-gray-700"
                >
                    <Home className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </motion.button>
            </div>

            <div className="max-w-4xl mx-auto rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-16 w-16 border-2 border-white">
                                <AvatarImage src={profilePicture || ''} alt={newUsername} />
                                <AvatarFallback className="bg-blue-500 text-white text-xl">
                                    {nameInitial}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => setShowUploader(true)}
                                className="absolute bottom-0 right-0 bg-blue-600 p-1 rounded-full border-2 border-white text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Camera size={14} />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{newUsername}'s Profile</h1>
                            <p className="text-blue-100 mt-1">Manage your account settings and preferences</p>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="profile" className="w-full p-6">
                    <TabsList className="grid grid-cols-5 mb-8">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span className="hidden sm:inline">Activity</span>
                        </TabsTrigger>
                        <TabsTrigger value="metrics" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline">Metrics</span>
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Security</span>
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="hidden sm:inline">Billing</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-500" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>
                                    Update your account details and personal information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="email">
                                                Email Address
                                            </label>
                                            <Input
                                                type="email"
                                                id="email"
                                                value={userData?.email || ''}
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                                disabled
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Your email address cannot be changed</p>
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="username">
                                                Username
                                            </label>
                                            <Input
                                                type="text"
                                                id="username"
                                                value={newUsername}
                                                onChange={handleUsernameChange}
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="bio">
                                                Bio
                                            </label>
                                            <Textarea
                                                id="bio"
                                                value={bio}
                                                onChange={handleBioChange}
                                                placeholder="Tell us about yourself..."
                                                className="bg-gray-50 dark:bg-gray-700/50 min-h-[120px] resize-none"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">{bio.length}/300 characters</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2" htmlFor="phone-number">
                                                Phone Number
                                            </label>
                                            <Input
                                                type="tel"
                                                id="phone-number"
                                                ref={phoneInputRef}
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="Enter phone number (e.g., +911234567890)"
                                                pattern="^\+[0-9]{1,4}[0-9]{6,12}$"
                                                title="Phone number must start with a country code (e.g., +91) followed by 6-12 digits"
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                                <Avatar className="h-24 w-24 mb-4">
                                                    <AvatarImage src={profilePicture || ''} alt={newUsername} />
                                                    <AvatarFallback className="bg-blue-500 text-white text-2xl">
                                                        {nameInitial}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Button
                                                    onClick={() => setShowUploader(true)}
                                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                                >
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Change Profile Picture
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mt-6">
                                    <Button
                                        onClick={handleUpdateProfile}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                    >
                                        Update Profile
                                    </Button>

                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                </div>

                                {updateError && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-sm">
                                        {updateError}
                                    </div>
                                )}

                                {updateSuccess && (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-600 dark:text-green-300 text-sm">
                                        Profile updated successfully!
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Recent Activity
                                </CardTitle>
                                <CardDescription>
                                    View your recent account activity and actions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityLogs.length > 0 ? (
                                    <div className="space-y-1">
                                        {activityLogs.map((log: { activity: string; timestamp: string }, index: number) => {
                                            // Determine the icon based on activity type
                                            let ActivityIcon = Activity;
                                            let iconColor = "text-blue-600 dark:text-blue-400";
                                            let bgColor = "bg-blue-100 dark:bg-blue-900/40";

                                            if (log.activity.toLowerCase().includes('logged in') || log.activity.toLowerCase().includes('signed in')) {
                                                ActivityIcon = LogIn;
                                                iconColor = "text-green-600 dark:text-green-400";
                                                bgColor = "bg-green-100 dark:bg-green-900/40";
                                            } else if (log.activity.toLowerCase().includes('logged out') || log.activity.toLowerCase().includes('signed out')) {
                                                ActivityIcon = LogOut;
                                                iconColor = "text-orange-600 dark:text-orange-400";
                                                bgColor = "bg-orange-100 dark:bg-orange-900/40";
                                            } else if (log.activity.toLowerCase().includes('update') || log.activity.toLowerCase().includes('change') || log.activity.toLowerCase().includes('edit')) {
                                                ActivityIcon = Edit;
                                                iconColor = "text-purple-600 dark:text-purple-400";
                                                bgColor = "bg-purple-100 dark:bg-purple-900/40";
                                            } else if (log.activity.toLowerCase().includes('profile picture')) {
                                                ActivityIcon = Camera;
                                                iconColor = "text-pink-600 dark:text-pink-400";
                                                bgColor = "bg-pink-100 dark:bg-pink-900/40";
                                            } else if (log.activity.toLowerCase().includes('create') || log.activity.toLowerCase().includes('created')) {
                                                ActivityIcon = FileEdit;
                                                iconColor = "text-indigo-600 dark:text-indigo-400";
                                                bgColor = "bg-indigo-100 dark:bg-indigo-900/40";
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex justify-between items-center p-3 rounded-lg transition-colors duration-150 ease-in-out
                                                        ${log.activity.toLowerCase().includes('login') || log.activity.toLowerCase().includes('signed in')
                                                            ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-100 dark:border-green-800/50'
                                                            : log.activity.toLowerCase().includes('logout') || log.activity.toLowerCase().includes('signed out')
                                                                ? 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`${log.activity.toLowerCase().includes('login') || log.activity.toLowerCase().includes('signed in')
                                                            ? 'h-10 w-10'
                                                            : log.activity.toLowerCase().includes('logout') || log.activity.toLowerCase().includes('signed out')
                                                                ? 'h-10 w-10'
                                                                : 'h-8 w-8'
                                                            } rounded-full ${bgColor} flex items-center justify-center`}>
                                                            <ActivityIcon className={`${log.activity.toLowerCase().includes('login') || log.activity.toLowerCase().includes('signed in') ||
                                                                log.activity.toLowerCase().includes('logout') || log.activity.toLowerCase().includes('signed out')
                                                                ? 'h-5 w-5'
                                                                : 'h-4 w-4'
                                                                } ${iconColor}`} />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${log.activity.toLowerCase().includes('login') || log.activity.toLowerCase().includes('signed in')
                                                                ? 'text-green-800 dark:text-green-300'
                                                                : log.activity.toLowerCase().includes('logout') || log.activity.toLowerCase().includes('signed out')
                                                                    ? 'text-orange-800 dark:text-orange-300'
                                                                    : 'text-gray-900 dark:text-gray-100'
                                                                }`}>{log.activity}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800/60 mb-4">
                                            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity has been recorded</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="metrics" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Usage Metrics
                                </CardTitle>
                                <CardDescription>
                                    Overview of your account usage and statistics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {usageMetrics ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                    <LogIn className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(usageMetrics.last_login as string).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(usageMetrics.last_login as string).toLocaleTimeString()}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logins</p>
                                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                                    <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {usageMetrics.total_logins as number}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">lifetime sessions</p>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Changes Made</p>
                                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                                                    <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {usageMetrics.changes_count as number}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">total updates</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800/60 mb-4">
                                            <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">No usage metrics available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    Change your password here. After saving, you'll be logged out.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-blue-500" />
                                        Current password
                                    </Label>
                                    <Input
                                        id="current"
                                        type="password"
                                        value={passwordData.current}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, current: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-green-500" />
                                        New password
                                    </Label>
                                    <Input
                                        id="new"
                                        type="password"
                                        value={passwordData.new}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, new: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-purple-500" />
                                        Confirm password
                                    </Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        value={passwordData.confirm}
                                        onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirm: e.target.value })
                                        }
                                    />
                                </div>
                                <Button onClick={handlePasswordChange} disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                    {isLoading ? <Loader size={20} /> : "Save password"}
                                </Button>
                                {passwordError && (
                                    <div className="text-red-500 text-sm mt-2">{passwordError}</div>
                                )}
                                {passwordSuccess && (
                                    <div className="text-green-500 text-sm mt-2">{passwordSuccess}</div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Active Sessions</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchSessions}
                                        disabled={sessionLoading}
                                    >
                                        {sessionLoading ? <Loader size={16} /> : "Refresh"}
                                    </Button>
                                </CardTitle>
                                <CardDescription>
                                    Manage your active login sessions across different devices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {sessionError && (
                                    <div className="text-red-500 text-sm mb-4">{sessionError}</div>
                                )}

                                {sessionLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader size={24} />
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/60 mb-4">
                                            <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">No active sessions found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions.map((session) => {
                                            // Determine the icon and color based on device type
                                            let DeviceIcon = Monitor;
                                            let bgColor = 'bg-blue-100 dark:bg-blue-900/40';
                                            let iconColor = 'text-blue-600 dark:text-blue-400';

                                            if (session.device_type === 'Mobile') {
                                                DeviceIcon = Smartphone;
                                                bgColor = 'bg-green-100 dark:bg-green-900/40';
                                                iconColor = 'text-green-600 dark:text-green-400';
                                            } else if (session.device_type === 'Tablet') {
                                                DeviceIcon = Tablet;
                                                bgColor = 'bg-purple-100 dark:bg-purple-900/40';
                                                iconColor = 'text-purple-600 dark:text-purple-400';
                                            }

                                            return (
                                                <div
                                                    key={session.id}
                                                    className={`p-4 rounded-lg border ${session.is_current ? 'bg-muted/50 border-primary/30' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center mt-1`}>
                                                                <DeviceIcon className={`h-4 w-4 ${iconColor}`} />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {session.device_type || 'Unknown device'}
                                                                    {session.is_current && (
                                                                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    Last active: {new Date(session.last_seen_at).toLocaleString()}
                                                                </div>
                                                                {session.ip && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        IP: {session.ip}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleTerminateSession(session.id, !!session.is_current)}
                                                            className={`${session.is_current
                                                                ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/30'
                                                                : 'text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30'
                                                                }`}
                                                        >
                                                            {session.is_current ? (
                                                                <span className="flex items-center gap-1">
                                                                    <LogOut className="h-4 w-4" />
                                                                    Sign out
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <X className="h-4 w-4" />
                                                                    Terminate
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                    Billing Information
                                </CardTitle>
                                <CardDescription>
                                    Manage your subscription and payment methods
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-6">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800/60 mb-4">
                                        <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">No billing information available</p>
                                    <Button className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                                        Setup Billing
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <AnimatePresence>
                {showUploader && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm mx-auto p-6 relative border border-gray-200 dark:border-gray-700"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", bounce: 0.3 }}
                        >
                            <div className="absolute top-4 right-4">
                                <Button
                                    onClick={() => setShowUploader(false)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Profile Picture</h3>
                            <UserProfilePictureUploader
                                onUploadSuccess={() => {
                                    // Refresh the profile picture after upload
                                    const newProfilePic = localStorage.getItem('profilePicture');
                                    if (newProfilePic) setProfilePicture(newProfilePic);
                                    setShowUploader(false);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserProfile;