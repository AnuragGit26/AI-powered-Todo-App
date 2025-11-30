import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Activity, CreditCard, Shield,
    Camera, Monitor, Smartphone, Tablet,
    FileEdit, X, MapPin, Clock, CheckCircle2, AlertCircle,
    Calendar, BarChart, TrendingUp, UserCheck, Trash2,
    Settings, RefreshCw, LogIn, LogOut, Edit, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfilePictureUploader from './UserProfilePictureUploader';
import { fetchUserSessions, terminateSession, UserSession, signOutOnAllDevices } from '../lib/sessionUtils';
import { invalidateUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BillingDashboard from './BillingDashboard';
import BillingAnalytics from './BillingAnalytics';
import { useTodoStore } from '../store/todoStore';

interface UserMetadata {
    bio?: string;
    email?: string;
    email_verified?: boolean;
    phone_number?: string;
    phone_verified?: boolean;
    username?: string;
}

interface AppMetadata {
    provider?: string;
    providers?: string[];
}

interface UserProfileProps {
    userData: {
        id: string;
        email?: string;
        phone?: string;
        app_metadata: AppMetadata;
        user_metadata: UserMetadata;
        created_at?: string;
        updated_at?: string;
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

    const { aiAnalysisEnabled, setAiAnalysisEnabled, todos, addDefaultRemindersToAllTasks } = useTodoStore();
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
                // Get profile picture URL only (no metadata update on mount)
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

    // Global sign-out (all devices)
    const handleSignOutAllDevices = async () => {
        // TODO: Replace window.confirm with a proper modal dialog for better UX
        const confirmed = window.confirm('This will sign you out on ALL devices and browsers. Continue?');
        if (!confirmed) return;
        try {
            await signOutOnAllDevices();
            toast.success('Signed out on all devices');
            navigate('/login');
        } catch (e) {
            console.error('Failed to sign out on all devices', e);
            toast.error('Failed to sign out on all devices');
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

    // Presence window for "Active now" (in ms)
    const ACTIVE_NOW_WINDOW_MS = 60 * 1000;
    const isSessionActiveNow = (session: UserSession): boolean => {
        try {
            const lastSeen = new Date(session.last_seen_at).getTime();
            return Date.now() - lastSeen <= ACTIVE_NOW_WINDOW_MS;
        } catch {
            return false;
        }
    };

    // Update the fetchSessions function
    const fetchSessions = useCallback(async () => {
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
    }, [userData?.id]);

    // Call fetchSessions when the Security tab is active
    useEffect(() => {
        if (activeTab === 'security') {
            fetchSessions();
        }
    }, [activeTab, fetchSessions]);

    // Live updates for session changes (insert/update/delete)
    useEffect(() => {
        if (activeTab !== 'security' || !userData?.id) return;
        const channel = supabase
            .channel(`user_sessions_${userData.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_sessions', filter: `user_id=eq.${userData.id}` },
                () => {
                    // Re-fetch sessions on any change
                    fetchSessions();
                }
            )
            .subscribe();
        const interval = setInterval(() => {
            // Force UI refresh to update "Active now" when threshold changes
            setSessions((prev) => [...prev]);
        }, 30 * 1000);
        return () => {
            try { supabase.removeChannel(channel); } catch { /* noop */ }
            clearInterval(interval);
        };
    }, [activeTab, userData?.id, fetchSessions]);

    // Add new function to fetch activity logs
    const fetchActivityLogs = useCallback(async () => {
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
    }, [userData?.id]);

    // Add useEffect to fetch activity logs when tab changes
    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLogs();
        }
    }, [activeTab, fetchActivityLogs]);

    if (!userData) {
        return <div>Loading user data...</div>;
    }

    const nameInitial = userData.user_metadata.username
        ? userData.user_metadata.username.charAt(0).toUpperCase()
        : (userData.email || '').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 md:p-8">
            <div className="max-w-5xl w-full mx-auto rounded-xl bg-white/10 dark:bg-gray-900/30 shadow-2xl border border-white/20 dark:border-gray-700/40 overflow-hidden backdrop-blur-xl flex flex-col">
                {/* Header with gradient background - Mobile optimized */}
                <div className="mobile-header-padding bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 dark:from-blue-700/80 dark:via-indigo-700/80 dark:to-purple-700/80">
                    <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                        <div className="relative group">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="relative"
                            >
                                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 border-4 border-white/80 shadow-lg">
                                    <AvatarImage src={profilePicture || ''} alt={userData.user_metadata.username || ''} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl sm:text-3xl">
                                        {nameInitial}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    onClick={() => setShowUploader(true)}
                                    className="absolute bottom-0 right-0 bg-blue-600 p-2 sm:p-2.5 rounded-full border-2 border-white text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:bg-blue-700 shadow-md touch-target"
                                    aria-label="Change profile picture"
                                >
                                    <Camera size={16} className="sm:w-4 sm:h-4" />
                                </button>
                            </motion.div>
                        </div>
                        <div className="text-center md:text-left flex-1 min-w-0">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate"
                            >
                                {userData.user_metadata.username || 'Your Profile'}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="text-blue-100 mt-2 max-w-md text-sm sm:text-base mx-auto md:mx-0"
                            >
                                {userData.user_metadata.bio || 'Manage your account settings and preferences'}
                            </motion.p>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="flex items-center justify-center md:justify-start mt-3 text-xs sm:text-sm text-blue-100/80"
                            >
                                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                <span>Member since {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : ''}</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
                        <TabsList className="mobile-tabs-list justify-start sm:justify-center h-auto p-2 mb-4 sm:mb-6 bg-gray-100/50 dark:bg-gray-800/30 rounded-lg">
                            <TabsTrigger value="profile" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Profile</span>
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <Activity className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Activity</span>
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <BarChart className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Analytics</span>
                            </TabsTrigger>
                            <TabsTrigger value="security" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <Shield className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Security</span>
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <CreditCard className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Billing</span>
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="mobile-tab-trigger flex items-center gap-1.5 sm:gap-2 touch-manipulation">
                                <Settings className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">Settings</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                        <TabsContent value="profile">
                            <div className="mobile-profile-layout">
                                {/* Left column - Personal Information */}
                                <div>
                                    <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                        <CardHeader className="mobile-card-header-padding">
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <User className="h-5 w-5 text-blue-500" />
                                                Personal Information
                                            </CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                Update your account details and personal information
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="mobile-card-content-padding space-y-4 sm:space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                <div>
                                                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={userData.email || ''}
                                                        disabled
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                    <div className="flex items-center mt-1.5 text-xs text-gray-500">
                                                        {userData.confirmed_at ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-500 flex-shrink-0" />
                                                        )}
                                                        <span className="break-words">
                                                            {userData.confirmed_at ? 'Verified email address' : 'Email address pending verification'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                                    <Input
                                                        id="username"
                                                        name="username"
                                                        value={editedData.username}
                                                        onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <Label htmlFor="phone-number" className="text-sm font-medium">Phone Number</Label>
                                                    <Input
                                                        id="phone-number"
                                                        name="phone_number"
                                                        ref={phoneInputRef}
                                                        value={editedData.phone_number}
                                                        onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                                                        type="tel"
                                                        pattern="^\+[0-9]{1,4}[0-9]{6,12}$"
                                                        title="Phone number must start with a country code (e.g., +91) followed by 6-12 digits"
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                    <div className="flex items-center mt-1.5 text-xs text-gray-500">
                                                        {userData.user_metadata.phone_verified ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-500 flex-shrink-0" />
                                                        )}
                                                        <span className="break-words">
                                                            {userData.user_metadata.phone_verified ? 'Verified phone number' : 'Phone number pending verification'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                                                    <Textarea
                                                        id="bio"
                                                        name="bio"
                                                        value={editedData.bio}
                                                        onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                                                        className="mt-1.5 mobile-textarea bg-gray-50/50 dark:bg-gray-800/30"
                                                        placeholder="Tell us a bit about yourself..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isLoading}
                                                    className="touch-target bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md w-full sm:w-auto"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>Save Changes</>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right column - Profile Picture */}
                                <div>
                                    <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                        <CardHeader className="mobile-card-header-padding">
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <Camera className="h-5 w-5 text-blue-500" />
                                                Profile Picture
                                            </CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                Update your profile image
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="mobile-card-content-padding">
                                            <div className="flex flex-col items-center justify-center p-4 sm:p-6 border border-dashed border-gray-300 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-4 sm:mb-6 border-2 border-gray-200 dark:border-gray-700">
                                                    <AvatarImage src={profilePicture || ''} alt={userData.user_metadata.username || ''} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl sm:text-4xl">
                                                        {nameInitial}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Button
                                                    onClick={() => setShowUploader(true)}
                                                    className="w-full touch-target bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                                                >
                                                    <Camera className="mr-2 h-4 w-4" />
                                                    Change Picture
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                <CardHeader className="mobile-card-header-padding">
                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                        <Activity className="h-5 w-5 text-blue-500" />
                                        Activity Dashboard
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">
                                        Track your account activity and interactions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="mobile-card-content-padding">
                                    {isLoadingActivity ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 sm:space-y-8">
                                            {/* Stats Cards - Responsive grid: 1→2→4 columns */}
                                            <div className="mobile-stats-grid">
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-5 rounded-xl shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Total Activities</p>
                                                            <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                                {activityStats.totalActivities}
                                                            </h3>
                                                        </div>
                                                        <div className="bg-blue-200/50 dark:bg-blue-700/30 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                                                            <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-5 rounded-xl shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Login Sessions</p>
                                                            <h3 className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                                                {activityStats.loginCount}
                                                            </h3>
                                                        </div>
                                                        <div className="bg-green-200/50 dark:bg-green-700/30 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                                                            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 sm:p-5 rounded-xl shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Profile Updates</p>
                                                            <h3 className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                                                {activityStats.profileUpdates}
                                                            </h3>
                                                        </div>
                                                        <div className="bg-purple-200/50 dark:bg-purple-700/30 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                                                            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 sm:p-5 rounded-xl shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Task Actions</p>
                                                            <h3 className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                                                                {activityStats.taskActions}
                                                            </h3>
                                                        </div>
                                                        <div className="bg-orange-200/50 dark:bg-orange-700/30 p-2 sm:p-3 rounded-lg flex-shrink-0 ml-2">
                                                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Activity Timeline */}
                                            <div className="mt-6 sm:mt-8">
                                                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                                    Activity Timeline
                                                </h3>
                                                <div className="space-y-3 sm:space-y-4">
                                                    {activityLogs.map((log, index) => (
                                                        <motion.div
                                                            key={log.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="mobile-activity-item p-3 sm:p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className={`p-2 sm:p-2.5 rounded-full flex-shrink-0 ${getActivityIconStyle(log.activity)}`}>
                                                                {getActivityIcon(log.activity)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                                                                    {log.activity}
                                                                </p>
                                                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                                    <span className="truncate">{new Date(log.timestamp).toLocaleString()}</span>
                                                                </p>
                                                            </div>
                                                            <div className="text-gray-400 dark:text-gray-600 flex-shrink-0 hidden sm:block">
                                                                <ChevronRight className="h-5 w-5" />
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {activityLogs.length === 0 && !isLoadingActivity && (
                                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500 font-medium">No activity recorded yet</p>
                                                    <p className="text-gray-400 text-sm mt-1">Your actions will appear here as you use the application</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics">
                            <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <BarChart className="h-5 w-5 text-blue-500" />
                                        Analytics
                                    </CardTitle>
                                    <CardDescription>
                                        Visualize your productivity and feature usage
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <BillingAnalytics />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <div className="mobile-security-layout">
                                {/* Password Change Section */}
                                <div>
                                    <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm h-full">
                                        <CardHeader className="mobile-card-header-padding">
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <Shield className="h-5 w-5 text-blue-500" />
                                                Password
                                            </CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                Update your password
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="mobile-card-content-padding space-y-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label htmlFor="current" className="text-sm font-medium">Current Password</Label>
                                                    <Input
                                                        id="current"
                                                        type="password"
                                                        value={passwordData.current}
                                                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="new" className="text-sm font-medium">New Password</Label>
                                                    <Input
                                                        id="new"
                                                        type="password"
                                                        value={passwordData.new}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="confirm" className="text-sm font-medium">Confirm Password</Label>
                                                    <Input
                                                        id="confirm"
                                                        type="password"
                                                        value={passwordData.confirm}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                        className="mt-1.5 mobile-input bg-gray-50/50 dark:bg-gray-800/30"
                                                    />
                                                </div>
                                            </div>

                                            {passwordError && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-md text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-start">
                                                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="break-words">{passwordError}</span>
                                                </div>
                                            )}

                                            {passwordSuccess && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-md text-green-600 dark:text-green-400 text-xs sm:text-sm flex items-start">
                                                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="break-words">{passwordSuccess}</span>
                                                </div>
                                            )}

                                            <Button
                                                onClick={handlePasswordChange}
                                                disabled={isLoading}
                                                className="w-full touch-target mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md"
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>Update Password</>
                                                )}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Active Sessions Section */}
                                <div>
                                    <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                        <CardHeader className="mobile-card-header-padding">
                                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                <Monitor className="h-5 w-5 text-blue-500" />
                                                Active Sessions
                                            </CardTitle>
                                            <CardDescription className="text-xs sm:text-sm">
                                                Manage your active login sessions across devices
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="mobile-card-content-padding">
                                            {sessionLoading ? (
                                                <div className="flex items-center justify-center py-12">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                                </div>
                                            ) : sessionError ? (
                                                <div className="flex items-center justify-center py-8 px-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                                                    <span className="break-words">{sessionError}</span>
                                                </div>
                                            ) : sessions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                                    <Monitor className="h-12 w-12 text-gray-400 mb-3" />
                                                    <span className="text-gray-500 font-medium text-sm sm:text-base">No active sessions found</span>
                                                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Your login sessions will appear here</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 sm:space-y-4">
                                                    {sessions.map((session) => {
                                                        const { device, location, lastActive, isCurrent, deviceIcon } = formatSessionInfo(session);
                                                        const activeNow = isSessionActiveNow(session);
                                                        return (
                                                            <motion.div
                                                                key={session.id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className={`mobile-session-card rounded-xl border ${isCurrent
                                                                    ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50'
                                                                    : 'bg-white dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50'
                                                                    } shadow-sm hover:shadow-md transition-all duration-200`}
                                                            >
                                                                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                                                                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${isCurrent
                                                                        ? 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400'
                                                                        : 'bg-gray-100 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400'
                                                                        }`}>
                                                                        {deviceIcon}
                                                                    </div>
                                                                    <div className="space-y-1 min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{device}</p>
                                                                            {isCurrent && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex-shrink-0">
                                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                                    Current
                                                                                </span>
                                                                            )}
                                                                            {activeNow && (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 flex-shrink-0">
                                                                                    <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                                                    Active now
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                                            <span className="truncate">{location}</span>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                                            <span className="truncate">Last active: {lastActive}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleSessionTerminate(session.id, isCurrent)}
                                                                    variant={isCurrent ? "default" : "destructive"}
                                                                    size="sm"
                                                                    className={`touch-target w-full sm:w-auto ${isCurrent
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
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Global Sign-out Section */}
                            <div className="mt-4 sm:mt-6">
                                <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <CardHeader className="mobile-card-header-padding">
                                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                            <LogOut className="h-5 w-5 text-red-500" />
                                            Sign out on all devices
                                        </CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">
                                            This will terminate all active sessions on every device and browser. Use this if you suspect account compromise or lost device.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="mobile-card-content-padding">
                                        <Button
                                            onClick={handleSignOutAllDevices}
                                            variant="destructive"
                                            className="w-full sm:w-auto touch-target"
                                        >
                                            <div className="flex items-center gap-2">
                                                <LogOut className="h-4 w-4" />
                                                Sign out on all devices
                                            </div>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="billing">
                            <BillingDashboard />
                        </TabsContent>

                        <TabsContent value="settings">
                            <div className="space-y-6">
                                <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5" />
                                            Application Settings
                                        </CardTitle>
                                        <CardDescription>
                                            Configure your application preferences and AI features
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <Label htmlFor="ai-analysis" className="text-base font-medium">
                                                    AI Analysis
                                                </Label>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Enable AI-powered task analysis, priority scoring, and insights
                                                </p>
                                            </div>
                                            <Switch
                                                id="ai-analysis"
                                                checked={aiAnalysisEnabled}
                                                onCheckedChange={setAiAnalysisEnabled}
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                        </div>

                                        {!aiAnalysisEnabled && (
                                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                            AI Analysis Disabled
                                                        </p>
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                            Task analysis will use basic templates instead of AI insights.
                                                            Priority scoring and advanced features will be disabled.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Task Reminders
                                        </CardTitle>
                                        <CardDescription>
                                            Manage default reminders for your tasks
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Label className="text-base font-medium">
                                                        Default Reminders
                                                    </Label>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Automatically add reminders to tasks with due dates
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {todos.filter(t => t.dueDate && !t.completed).length} tasks with due dates
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {todos.filter(t => t.reminders && t.reminders.length > 0).length} tasks with reminders
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                            Default Reminder Schedule
                                                        </p>
                                                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                                            <li>• 24 hours before due date</li>
                                                            <li>• 2 hours before due date</li>
                                                            <li>• 30 minutes before due date</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => {
                                                    addDefaultRemindersToAllTasks();
                                                    toast.success('Default reminders added to all eligible tasks!');
                                                }}
                                                className="w-full"
                                                variant="outline"
                                            >
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Add Default Reminders to All Tasks
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </div>
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
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
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
                            {error ? (
                                <AlertCircle className="h-5 w-5" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5" />
                            )}
                            <span>{error || success}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setError(null);
                                    setSuccess(null);
                                }}
                                className="text-white hover:bg-white/20 ml-2"
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
    if (activity.includes('logged in')) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (activity.includes('logged out')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    if (activity.includes('profile')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (activity.includes('Task Created')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    if (activity.includes('Task Deleted')) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (activity.includes('Updated')) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
};

export default UserProfile;