import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Activity, CreditCard, Shield,
    Camera, Monitor, Smartphone, Tablet,
    FileEdit, X, MapPin, Clock, CheckCircle2, AlertCircle,
    Calendar, BarChart, TrendingUp, UserCheck, Trash2,
    Settings, RefreshCw, LogIn, LogOut, Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfilePictureUploader from './UserProfilePictureUploader';
import { fetchUserSessions, terminateSession, UserSession } from '../lib/sessionUtils';
import { invalidateUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface UserMetadata {
    bio?: string;
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_verified?: boolean;
    username?: string;
}

interface AppMetadata {
    provider: string;
    providers: string[];
}

interface UserProfileProps {
    userData: {
        id: string;
        email: string;
        phone?: string;
        app_metadata: AppMetadata;
        user_metadata: UserMetadata;
        created_at: string;
        updated_at: string;
        confirmed_at?: string;
        last_sign_in_at?: string;
        role?: string;
    };
}

interface EditedData {
    username: string;
    bio: string;
    phone_number: string;
    email: string;
}

interface FormattedSession {
    device: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
    deviceIcon: React.ReactNode;
}

interface ActivityLog {
    id: string;
    user_id: string;
    activity: string;
    timestamp: string;
}

interface ActivityStats {
    totalActivities: number;
    loginCount: number;
    profileUpdates: number;
    taskActions: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ userData }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<EditedData>({
        username: userData.user_metadata.username || '',
        bio: userData.user_metadata.bio || '',
        phone_number: userData.user_metadata.phone_number || userData.phone || '',
        email: userData.email || ''
    });
    const [showUploader, setShowUploader] = useState(false);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const navigate = useNavigate();
    const phoneInputRef = useRef<HTMLInputElement>(null);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    // Add new state variables inside UserProfile component
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [activityStats, setActivityStats] = useState<ActivityStats>({
        totalActivities: 0,
        loginCount: 0,
        profileUpdates: 0,
        taskActions: 0
    });
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);

    useEffect(() => {
        const loadSessions = async () => {
            if (!userData?.id) return;
            setSessionLoading(true);
            try {
                const userSessions = await fetchUserSessions(userData.id);
                setSessions(userSessions);
            } catch {
                setSessionError('Failed to load sessions');
            } finally {
                setSessionLoading(false);
            }
        };
        loadSessions();
    }, [userData?.id]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!userData?.id) return;

            try {
                // Update user metadata if needed
                const { error: updateError } = await supabase.auth.updateUser({
                    data: {
                        username: editedData.username,
                        bio: editedData.bio,
                        phone_number: editedData.phone_number,
                        email: userData.email,
                        email_verified: userData.confirmed_at ? true : false,
                        phone_verified: false // You might want to implement phone verification
                    }
                });

                if (updateError) {
                    console.error('Error updating user metadata:', updateError);
                    toast.error('Failed to update user data');
                    return;
                }

                // Get profile picture URL
                const bucketName = "MultiMedia Bucket";
                const filePath = `${userData.id}/profile.jpg`;
                const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                setProfilePicture(data.publicUrl);

            } catch (error) {
                console.error('Error in fetchInitialData:', error);
                toast.error('Failed to load user data');
            }
        };

        fetchInitialData();
    }, [userData?.id]);

    const handleSessionTerminate = async (sessionId: string, isCurrent: boolean) => {
        try {
            await terminateSession(sessionId);
            if (isCurrent) {
                await supabase.auth.signOut();
                navigate('/login');
            } else {
                setSessions((prevSessions: UserSession[]) => prevSessions.filter(session => session.id !== sessionId));
                setSuccess('Session terminated successfully');
            }
        } catch {
            setError('Failed to terminate session');
        }
    };

    const handleSave = async () => {
        if (!userData?.id) {
            toast.error('User ID not found');
            return;
        }

        if (phoneInputRef.current && !phoneInputRef.current.checkValidity()) {
            toast.error('Invalid phone number format');
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: {
                    username: editedData.username,
                    bio: editedData.bio,
                    phone_number: editedData.phone_number
                }
            });

            if (updateError) throw updateError;

            toast.success('Profile updated successfully');
            invalidateUserData();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update password";
            setPasswordError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Update session display logic
    const formatSessionInfo = (session: UserSession): FormattedSession => {
        const deviceInfo = session.user_agent || 'Unknown Device';
        let device = 'Unknown';
        let deviceIcon = <Monitor className="h-5 w-5" />;

        if (deviceInfo.toLowerCase().includes('mobile')) {
            device = 'Mobile Device';
            deviceIcon = <Smartphone className="h-5 w-5" />;
        } else if (deviceInfo.toLowerCase().includes('tablet')) {
            device = 'Tablet';
            deviceIcon = <Tablet className="h-5 w-5" />;
        } else {
            device = 'Desktop';
            deviceIcon = <Monitor className="h-5 w-5" />;
        }

        const location = session.location || 'Unknown Location';
        const lastActive = session.last_seen_at
            ? new Date(session.last_seen_at).toLocaleString()
            : 'Unknown';
        const isCurrent = session.is_current || false;

        return {
            device,
            location,
            lastActive,
            isCurrent,
            deviceIcon
        };
    };

    // Update the fetchSessions function
    const fetchSessions = async () => {
        if (!userData?.id) return;

        setSessionLoading(true);
        try {
            const userSessions = await fetchUserSessions(userData.id);
            setSessions(userSessions);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Failed to fetch sessions');
            setSessionError('Failed to load sessions');
        } finally {
            setSessionLoading(false);
        }
    };

    // Call fetchSessions when the Security tab is active
    useEffect(() => {
        if (activeTab === 'security') {
            fetchSessions();
        }
    }, [activeTab, userData?.id]);

    // Add new function to fetch activity logs
    const fetchActivityLogs = async () => {
        if (!userData?.id) return;

        setIsLoadingActivity(true);
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('user_id', userData.id)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            setActivityLogs(data || []);

            // Calculate statistics
            const stats = {
                totalActivities: data?.length || 0,
                loginCount: data?.filter(log => log.activity.includes('logged in')).length || 0,
                profileUpdates: data?.filter(log => log.activity.includes('profile')).length || 0,
                taskActions: data?.filter(log =>
                    log.activity.includes('Task') ||
                    log.activity.includes('Subtask')
                ).length || 0
            };
            setActivityStats(stats);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            toast.error('Failed to load activity data');
        } finally {
            setIsLoadingActivity(false);
        }
    };

    // Add useEffect to fetch activity logs when tab changes
    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLogs();
        }
    }, [activeTab, userData?.id]);

    if (!userData) {
        return <div>Loading user data...</div>;
    }

    const nameInitial = userData.user_metadata.username ?
        userData.user_metadata.username.charAt(0).toUpperCase() :
        userData.email.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-white/10 dark:bg-transparent p-4 md:p-8">
            <div className="max-w-4xl mx-auto rounded-xl bg-white dark:bg-gray-900/20 shadow-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-600/80 dark:to-purple-600/80">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-16 w-16 border-2 border-white">
                                <AvatarImage src={profilePicture || ''} alt={userData.user_metadata.username || ''} />
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
                            <h1 className="text-2xl font-bold text-white">
                                {userData.user_metadata.username || 'Your'}'s Profile
                            </h1>
                            <p className="text-blue-100 mt-1">
                                {userData.user_metadata.bio || 'Manage your account settings and preferences'}
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-6">
                    <TabsList className="grid grid-cols-4 mb-8 bg-gray-100/50 dark:bg-gray-800/30">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span className="hidden sm:inline">Activity</span>
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

                    <TabsContent value="profile">
                        <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50">
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
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email}
                                                disabled
                                                className="bg-gray-50/50 dark:bg-gray-800/30"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                {userData.confirmed_at ? 'Verified email address' : 'Email address pending verification'}
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                value={editedData.username}
                                                onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                                                className="bg-gray-50/50 dark:bg-gray-800/30"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="bio">Bio</Label>
                                            <Textarea
                                                id="bio"
                                                name="bio"
                                                value={editedData.bio}
                                                onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                                                className="bg-gray-50/50 dark:bg-gray-800/30 min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="phone-number">Phone Number</Label>
                                            <Input
                                                id="phone-number"
                                                name="phone_number"
                                                ref={phoneInputRef}
                                                value={editedData.phone_number}
                                                onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                                                type="tel"
                                                pattern="^\+[0-9]{1,4}[0-9]{6,12}$"
                                                title="Phone number must start with a country code (e.g., +91) followed by 6-12 digits"
                                                className="bg-gray-50/50 dark:bg-gray-800/30"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                {userData.user_metadata.phone_verified ? 'Verified phone number' : 'Phone number pending verification'}
                                            </p>
                                        </div>

                                        <div className="pt-4">
                                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                                <Avatar className="h-24 w-24 mb-4">
                                                    <AvatarImage src={profilePicture || ''} alt={userData.user_metadata.username || ''} />
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
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                    >
                                        {isLoading ? 'Saving...' : 'Update Profile'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-blue-500" />
                                    Security & Sessions
                                </CardTitle>
                                <CardDescription>
                                    Manage your password and active login sessions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Password Change Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Change Password</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input
                                            id="current"
                                            type="password"
                                            value={passwordData.current}
                                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input
                                            id="new"
                                            type="password"
                                            value={passwordData.new}
                                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm">Confirm Password</Label>
                                        <Input
                                            id="confirm"
                                            type="password"
                                            value={passwordData.confirm}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={isLoading}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                    >
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                    {passwordError && (
                                        <p className="text-red-500 text-sm">{passwordError}</p>
                                    )}
                                    {passwordSuccess && (
                                        <p className="text-green-500 text-sm">{passwordSuccess}</p>
                                    )}
                                </div>

                                {/* Active Sessions Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Active Sessions</h3>
                                    {sessionLoading ? (
                                        <div className="flex items-center justify-center py-6 space-x-2 text-gray-500">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                            <span>Loading sessions...</span>
                                        </div>
                                    ) : sessionError ? (
                                        <div className="flex items-center justify-center py-6 space-x-2 text-red-500">
                                            <AlertCircle className="h-5 w-5" />
                                            <span>{sessionError}</span>
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 space-y-2 text-gray-500">
                                            <Monitor className="h-8 w-8" />
                                            <span>No active sessions found</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {sessions.map((session) => {
                                                const { device, location, lastActive, isCurrent, deviceIcon } = formatSessionInfo(session);
                                                return (
                                                    <motion.div
                                                        key={session.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`p-4 rounded-xl border ${isCurrent
                                                            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                                                            : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                                                            } shadow-sm hover:shadow-md transition-shadow`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-4">
                                                                <div className={`p-2 rounded-lg ${isCurrent
                                                                    ? 'bg-blue-100 dark:bg-blue-800/40'
                                                                    : 'bg-gray-100 dark:bg-gray-700/40'
                                                                    }`}>
                                                                    {deviceIcon}
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center space-x-2">
                                                                        <p className="font-medium">{device}</p>
                                                                        {isCurrent && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                                Current Device
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                                        <MapPin className="h-4 w-4" />
                                                                        <span>{location}</span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                                        <Clock className="h-4 w-4" />
                                                                        <span>Last active: {lastActive}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => handleSessionTerminate(session.id, isCurrent)}
                                                                variant={isCurrent ? "default" : "destructive"}
                                                                size="sm"
                                                                className={`ml-4 ${isCurrent
                                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                    : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isCurrent ? (
                                                                        <>
                                                                            <LogOut className="h-4 w-4" />
                                                                            Logout
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <X className="h-4 w-4" />
                                                                            Terminate
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Activity Dashboard
                                </CardTitle>
                                <CardDescription>
                                    Track your account activity and interactions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingActivity ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                                                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                            {activityStats.totalActivities}
                                                        </h3>
                                                    </div>
                                                    <BarChart className="h-8 w-8 text-blue-500" />
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Login Sessions</p>
                                                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                            {activityStats.loginCount}
                                                        </h3>
                                                    </div>
                                                    <UserCheck className="h-8 w-8 text-green-500" />
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Profile Updates</p>
                                                        <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                            {activityStats.profileUpdates}
                                                        </h3>
                                                    </div>
                                                    <Settings className="h-8 w-8 text-purple-500" />
                                                </div>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Task Actions</p>
                                                        <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                            {activityStats.taskActions}
                                                        </h3>
                                                    </div>
                                                    <TrendingUp className="h-8 w-8 text-orange-500" />
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* Activity Timeline */}
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <Calendar className="h-5 w-5 text-blue-500" />
                                                Activity Timeline
                                            </h3>
                                            <div className="space-y-4">
                                                {activityLogs.map((log, index) => (
                                                    <motion.div
                                                        key={log.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                                                    >
                                                        <div className={`p-2 rounded-full ${getActivityIconStyle(log.activity)}`}>
                                                            {getActivityIcon(log.activity)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                                {log.activity}
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <Clock className="h-4 w-4" />
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {activityLogs.length === 0 && !isLoadingActivity && (
                                            <div className="text-center py-8">
                                                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-500">No activity recorded yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing">
                        <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50">
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
                            className="bg-white dark:bg-gray-900/90 rounded-xl shadow-2xl max-w-sm mx-auto p-6 relative backdrop-blur-sm"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <button
                                onClick={() => setShowUploader(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <UserProfilePictureUploader
                                onUploadSuccess={() => {
                                    const newProfilePic = localStorage.getItem('profilePicture');
                                    if (newProfilePic) setProfilePicture(newProfilePic);
                                    setShowUploader(false);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {(error || success) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${error ? 'bg-red-500' : 'bg-green-500'
                            } text-white`}
                    >
                        <div className="flex items-center space-x-2">
                            <span>{error || success}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="text-white hover:bg-white/20"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Add helper functions
const getActivityIcon = (activity: string) => {
    if (activity.includes('logged in')) return <LogIn className="h-4 w-4" />;
    if (activity.includes('logged out')) return <LogOut className="h-4 w-4" />;
    if (activity.includes('profile')) return <Edit className="h-4 w-4" />;
    if (activity.includes('Task Created')) return <FileEdit className="h-4 w-4" />;
    if (activity.includes('Task Deleted')) return <Trash2 className="h-4 w-4" />;
    if (activity.includes('Updated')) return <RefreshCw className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
};

const getActivityIconStyle = (activity: string) => {
    if (activity.includes('logged in')) return 'bg-green-100 dark:bg-green-900/20 text-green-600';
    if (activity.includes('logged out')) return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600';
    if (activity.includes('profile')) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
    if (activity.includes('Task Created')) return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600';
    if (activity.includes('Task Deleted')) return 'bg-red-100 dark:bg-red-900/20 text-red-600';
    if (activity.includes('Updated')) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600';
    return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600';
};

export default UserProfile;