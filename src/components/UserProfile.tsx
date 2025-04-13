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
    User, Activity, BarChart3, CreditCard, Shield,
    Camera, Monitor, Smartphone, Tablet, LogIn, LogOut, Edit,
    FileEdit, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserProfilePictureUploader from './UserProfilePictureUploader';
import { fetchUserSessions, terminateSession, UserSession } from '../lib/sessionUtils';
import { invalidateUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface UserProfileProps {
    userData: {
        id?: string;
        full_name?: string;
        email?: string;
        bio?: string;
        username?: string;
        phoneNumber?: string;
    };
}

interface EditedData {
    id?: string;
    full_name?: string;
    email?: string;
    bio?: string;
    username?: string;
    phoneNumber?: string;
}

interface FormattedSession {
    device: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ userData }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<EditedData>(userData);
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
                // Fetch profile data from Supabase
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', userData.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    throw profileError;
                }

                // Set edited data with profile data
                setEditedData({
                    ...userData,
                    username: profileData?.username || userData.username || '',
                    bio: profileData?.bio || userData.bio || '',
                    phoneNumber: profileData?.phone_number || userData.phoneNumber || ''
                });

                // Get profile picture URL
                const bucketName = "MultiMedia Bucket";
                const filePath = `${userData.id}/profile.jpg`;
                const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                setProfilePicture(data.publicUrl);

            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
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
        if (!userData?.id) return;

        if (phoneInputRef.current && !phoneInputRef.current.checkValidity()) {
            setError('Invalid phone number format');
            return;
        }

        setIsLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update(editedData)
                .eq('id', userData.id);

            if (updateError) throw updateError;

            setSuccess('Profile updated successfully');
            invalidateUserData();
        } catch {
            setError('Failed to update profile');
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedData((prev: EditedData) => ({ ...prev, [name]: value }));
    };

    // Update session display logic
    const formatSessionInfo = (session: UserSession): FormattedSession => {
        const deviceInfo = session.user_agent || 'Unknown Device';
        let device = 'Unknown';

        if (deviceInfo.toLowerCase().includes('mobile')) {
            device = 'Mobile Device';
        } else if (deviceInfo.toLowerCase().includes('tablet')) {
            device = 'Tablet';
        } else {
            device = 'Desktop';
        }

        const location = session.ip_address ? `IP: ${session.ip_address}` : 'Unknown Location';
        const lastActive = session.last_active_at
            ? new Date(session.last_active_at).toLocaleString()
            : 'Unknown';
        const isCurrent = session.is_current || false;

        return {
            device,
            location,
            lastActive,
            isCurrent
        };
    };

    // Update the fetchSessions function
    const fetchSessions = async () => {
        try {
            const { data: sessionData, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', userData?.id);

            if (error) throw error;
            setSessions(sessionData || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch sessions',
                variant: 'destructive',
            });
        }
    };

    if (!userData) {
        return <div>Loading user data...</div>;
    }

    const nameInitial = userData.username ? userData.username.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-white/10 p-4 md:p-8">
            <div className="max-w-4xl mx-auto rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-16 w-16 border-2 border-white">
                                <AvatarImage src={profilePicture || ''} alt={userData.username} />
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
                            <h1 className="text-2xl font-bold text-white">{userData.username}'s Profile</h1>
                            <p className="text-blue-100 mt-1">Manage your account settings and preferences</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-6">
                    <TabsList className="grid grid-cols-4 mb-8">
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
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email || ''}
                                                disabled
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">Your email address cannot be changed</p>
                                        </div>

                                        <div>
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                value={editedData.username || ''}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="bio">Bio</Label>
                                            <Textarea
                                                id="bio"
                                                name="bio"
                                                value={editedData.bio || ''}
                                                onChange={handleInputChange}
                                                className="bg-gray-50 dark:bg-gray-700/50 min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="phone-number">Phone Number</Label>
                                            <Input
                                                id="phone-number"
                                                name="phoneNumber"
                                                ref={phoneInputRef}
                                                value={editedData.phoneNumber || ''}
                                                onChange={handleInputChange}
                                                type="tel"
                                                pattern="^\+[0-9]{1,4}[0-9]{6,12}$"
                                                title="Phone number must start with a country code (e.g., +91) followed by 6-12 digits"
                                                className="bg-gray-50 dark:bg-gray-700/50"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                                <Avatar className="h-24 w-24 mb-4">
                                                    <AvatarImage src={profilePicture || ''} alt={userData.username} />
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

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Active Sessions
                                </CardTitle>
                                <CardDescription>
                                    Manage your active login sessions across different devices
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sessionLoading ? (
                                    <div className="text-center py-6">Loading sessions...</div>
                                ) : (
                                    <div className="space-y-4">
                                        {sessions.map((session) => {
                                            const { device, location, lastActive, isCurrent } = formatSessionInfo(session);
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">{device}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {location} • Last active: {lastActive}
                                                            </p>
                                                        </div>
                                                        {!isCurrent && (
                                                            <Button
                                                                onClick={() => handleSessionTerminate(session.id, false)}
                                                                variant="destructive"
                                                            >
                                                                Terminate
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>
                                    Update your password here. You'll be logged out after changing it.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing">
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
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm mx-auto p-6 relative"
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

export default UserProfile;