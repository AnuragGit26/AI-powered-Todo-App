import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { fetchUserSessions, terminateSession } from '../lib/sessionUtils';
import { invalidateUserData } from '../hooks/useUserData';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface UserProfileProps {
    userData: {
        id?: string;
        full_name?: string;
        email?: string;
        bio?: string;
        location?: string;
        website?: string;
        company?: string;
        job_title?: string;
        timezone?: string;
        language?: string;
        theme?: string;
        notifications?: boolean;
        two_factor_enabled?: boolean;
        last_login?: string;
        created_at?: string;
        updated_at?: string;
        profile_picture?: string;
        cover_picture?: string;
        social_links?: Record<string, string>;
        preferences?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
        username?: string;
        phoneNumber?: string;
    };
}

interface UserSession {
    id: string;
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
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(userData);

    useEffect(() => {
        const loadSessions = async () => {
            if (!userData.id) return;

            try {
                const userSessions = await fetchUserSessions(userData.id);
                const formattedSessions: UserSession[] = userSessions.map(session => ({
                    id: session.id,
                    device: session.device_type || 'Unknown Device',
                    location: session.location || 'Unknown Location',
                    lastActive: new Date(session.last_seen_at).toLocaleString(),
                    isCurrent: session.is_current || false
                }));
                setSessions(formattedSessions);
            } catch {
                setError('Failed to load sessions');
            }
        };
        loadSessions();
    }, [userData.id]);

    const handleSessionTerminate = async (sessionId: string) => {
        try {
            await terminateSession(sessionId);
            setSessions(prevSessions => prevSessions.filter(session => session.id !== sessionId));
            setSuccess('Session terminated successfully');
        } catch {
            setError('Failed to terminate session');
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update(editedData)
                .eq('id', userData.id);

            if (error) throw error;

            setSuccess('Profile updated successfully');
            setIsEditing(false);
            invalidateUserData();
        } catch {
            setError('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={userData.profile_picture} />
                                        <AvatarFallback>{userData.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold">{userData.full_name}</h3>
                                        <p className="text-sm text-muted-foreground">{userData.email}</p>
                                    </div>
                                </div>

                                <Separator />

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                value={editedData.full_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="bio">Bio</Label>
                                            <Textarea
                                                id="bio"
                                                name="bio"
                                                value={editedData.bio}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button onClick={handleSave} disabled={isLoading}>
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-medium">Bio</h4>
                                            <p className="text-muted-foreground">{userData.bio || 'No bio provided'}</p>
                                        </div>
                                        <Button onClick={() => setIsEditing(true)}>
                                            Edit Profile
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="security">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium">Two-Factor Authentication</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {userData.two_factor_enabled ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                                <Button variant="outline">
                                    {userData.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="sessions">
                            <div className="space-y-4">
                                {sessions.map(session => (
                                    <Card key={session.id}>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{session.device}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {session.location} • Last active: {session.lastActive}
                                                    </p>
                                                </div>
                                                {!session.isCurrent && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleSessionTerminate(session.id)}
                                                    >
                                                        Terminate
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg"
                    >
                        <div className="flex items-center space-x-2">
                            <span>{error}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 right-4 bg-success text-success-foreground p-4 rounded-lg shadow-lg"
                    >
                        <div className="flex items-center space-x-2">
                            <span>{success}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSuccess(null)}
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