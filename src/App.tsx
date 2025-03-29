// In src/App.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListTodo } from "lucide-react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import ThemeCustomizer from "./components/ThemeCustomizer";
import { useTodoStore } from "./store/todoStore";
import { createClient, Session } from "@supabase/supabase-js";
import { LoginForm } from "./components/LoginForm";
import { SignUpForm } from "./components/SignupForm";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { PasswordResetRequestForm } from "./components/PasswordResetRequestForm";
import { Toaster } from "./components/ui/toaster";
import { fetchSubtasks, fetchTasks } from "./services/taskService.ts";
import NotFound from "./components/NotFound";
import Aurora from "./components/ui/AuroraBG.tsx";
import UserProfile from "./components/UserProfile";
import SplitText from "./components/ui/SplitText.jsx";
import TaskAnalytics from "./components/TaskAnalytics.jsx";
import ProductivityTrends from "./components/ProductivityTrends.tsx";
import Footer from "./components/ui/Footer";
import { useSessionRecording } from './hooks/useSessionRecording';
import { RunDatabaseMigration } from './db/RunDatabaseMigration';
import { checkExistingSession, cleanupDuplicateSessions } from './lib/sessionUtils';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App: React.FC = () => {
    const theme = useTodoStore((state) => state.theme);
    const [session, setSession] = useState<Session | null>(null);
    const { setTodos, setUserToken } = useTodoStore();
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [userData, setUserData] = useState<{ userId?: string, username?: string, profilePicture?: string }>({});

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                sessionStorage.setItem("token", session.access_token || "");
                setUserToken(session.access_token || "");
                setIsDataLoaded(false);

                // Start session operations in the background without waiting or blocking app loading
                (async () => {
                    try {
                        // Longer timeout (10 seconds) that won't block the app
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Session initialization timed out')), 10000)
                        );

                        // Race between normal initialization and timeout
                        await Promise.race([
                            (async () => {
                                // Check for existing session or create a new one
                                await checkExistingSession();

                                // Clean up any duplicate sessions for this user on this device
                                if (session.user?.id) {
                                    await cleanupDuplicateSessions(session.user.id);
                                }
                            })(),
                            timeoutPromise
                        ]);
                    } catch (error) {
                        // Log but don't block the app
                        console.warn('Session initialization background task:', error);
                    }
                })();

                // Continue loading the app immediately without waiting for session operations
                // Tasks will still load based on the loadData function result
            } else {
                setIsDataLoaded(true);
            }
        });
        return () => subscription.unsubscribe();
    }, [setUserToken]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                localStorage.setItem("username", user.user_metadata.username);
                localStorage.setItem("userId", user.id);
                setUserData({ userId: user.id, username: user.user_metadata.username });
            }
        };
        fetchUser();
        const fetchProfileImage = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;
            if (!userId) return;

            const bucketName = "MultiMedia Bucket";

            // Try lowercase first (the standard we're using when uploading)
            const filePath = `${userId}/profile.jpg`;
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            // Store the URL in localStorage - the browser will handle if the image 
            // doesn't exist (will show the fallback avatar in the UI)
            localStorage.setItem("profilePicture", data.publicUrl);
            setUserData(prev => ({ ...prev, userId, profilePicture: data.publicUrl }));
        };
        fetchProfileImage();
    }, [setUserData]);

    useEffect(() => {
        if (!session) return;
        const loadData = async () => {
            try {
                // Get current userId to ensure it's available at fetch time
                const userId = localStorage.getItem('userId');

                if (!userId) {
                    // If userId is not available yet, try to get it from session
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        localStorage.setItem("userId", user.id);
                    } else {
                        console.error("User ID not available");
                        setIsDataLoaded(true);
                        return;
                    }
                }

                const tasks = await fetchTasks();
                const tasksWithSubtasks = await Promise.all(
                    (tasks || []).map(async (task) => {
                        const subtasks = await fetchSubtasks(task.id);
                        return { ...task, subtasks: subtasks || [] };
                    })
                );
                setTodos(tasksWithSubtasks);
            } catch (error) {
                console.error("Error fetching tasks/subtasks:", error);
            } finally {
                setIsDataLoaded(true);
            }
        };
        loadData();
    }, [session, setTodos, userData.userId]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme.mode === "dark");
    }, [theme.mode]);

    const handleAnimationComplete = () => {
        console.log("All letters have animated!");
    };

    // Record user sessions when logged in
    useSessionRecording();

    if (!isDataLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl text-gray-700 dark:text-gray-300">
                    <SplitText
                        text="Getting things ready for you....!"
                        className="text-2xl font-semibold text-center"
                        delay={70}
                        animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0)" }}
                        animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
                        easing="easeOutCubic"
                        threshold={0.2}
                        rootMargin="-50px"
                        onLetterAnimationComplete={handleAnimationComplete}
                    />
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<><LoginForm /><Toaster /></>} />
            <Route path="/signup" element={<><SignUpForm /><Toaster /></>} />
            <Route path="/password-reset-request" element={<><PasswordResetRequestForm /><Toaster /></>} />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute isAuthenticated={sessionStorage.getItem("token") != null}>
                        <div
                            className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden"
                            style={{
                                "--primary-color": theme.primaryColor,
                                "--secondary-color": theme.secondaryColor,
                            } as React.CSSProperties}
                        >
                            <Aurora
                                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                                blend={0.5}
                                amplitude={1.0}
                                speed={0.7}
                            />
                            <UserProfile />
                            <Footer />
                            <Toaster />
                        </div>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute isAuthenticated={sessionStorage.getItem("token") != null}>
                        <div
                            className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden"
                            style={{
                                "--primary-color": theme.primaryColor,
                                "--secondary-color": theme.secondaryColor,
                            } as React.CSSProperties}
                        >
                            <Aurora
                                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                                blend={0.5}
                                amplitude={1.0}
                                speed={0.7}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-start mt-24 p-8 md:shadow-xl">
                                <ThemeCustomizer />
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-3/5 mx-auto"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <ListTodo className="w-10 h-10 text-blue-500" />
                                        <h1 className="text-4xl font-bold">TaskMind AI</h1>
                                    </div>
                                    <TodoForm />
                                    <TodoList />
                                    <Toaster />
                                </motion.div>
                            </div>
                            <div className="fixed top-16 right-0 max-h-full w-90 p-6 pt-6 overflow-y-scroll z-10">
                                <TaskAnalytics />
                                <ProductivityTrends />
                            </div>
                            <Footer />
                        </div>
                    </ProtectedRoute>
                }
            />
            <Route path="/admin/migration" element={
                <ProtectedRoute isAuthenticated={sessionStorage.getItem("token") != null}>
                    <RunDatabaseMigration />
                </ProtectedRoute>
            } />
            <Route path="*" element={<><NotFound /><Toaster /></>} />
        </Routes>
    );
};

export default React.memo(App);