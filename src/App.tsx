// In src/App.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
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
import { Button } from "./components/ui/button.tsx";
import ShinyText from "./components/ui/ShinyText.tsx";
import Logo from "./components/Logo.tsx";
import NavBar from "./components/NavBar";
import { initializeTheme } from "./lib/themeUtils";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App: React.FC = () => {
    const theme = useTodoStore((state) => state.theme);
    const [session, setSession] = useState<Session | null>(null);
    const { setTodos, setUserToken, setTheme } = useTodoStore();
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [userData, setUserData] = useState<{ userId?: string, username?: string, profilePicture?: string }>({});
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showTodoForm, setShowTodoForm] = useState(false);

    // Initialize theme on first load and whenever theme changes
    useEffect(() => {
        // If no theme preference has been set in localStorage
        if (!localStorage.getItem('todo-storage')) {
            // Set light mode default theme
            const defaultTheme = {
                mode: 'light' as 'light' | 'dark',
                primaryColor: '#53c9d9',
                secondaryColor: '#5f4ae8',
            };

            // Update the store
            setTheme(defaultTheme);
        }

        // Initialize theme with current settings
        initializeTheme(theme);
    }, [theme, setTheme]);

    // Listen for analytics toggle event from NavBar
    useEffect(() => {
        const handleToggleAnalytics = () => {
            setShowAnalytics(prev => !prev);
        };

        window.addEventListener('toggleAnalytics', handleToggleAnalytics);

        return () => {
            window.removeEventListener('toggleAnalytics', handleToggleAnalytics);
        };
    }, []);

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

    // Media query for screens larger than 1600px
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const largeMediaQuery = window.matchMedia('(min-width: 1600px)');
        const smallMediaQuery = window.matchMedia('(max-width: 639px)');

        setIsLargeScreen(largeMediaQuery.matches);
        setIsSmallScreen(smallMediaQuery.matches);

        const handleLargeResize = (e: MediaQueryListEvent) => {
            setIsLargeScreen(e.matches);
        };

        const handleSmallResize = (e: MediaQueryListEvent) => {
            setIsSmallScreen(e.matches);
        };

        largeMediaQuery.addEventListener('change', handleLargeResize);
        smallMediaQuery.addEventListener('change', handleSmallResize);

        return () => {
            largeMediaQuery.removeEventListener('change', handleLargeResize);
            smallMediaQuery.removeEventListener('change', handleSmallResize);
        };
    }, []);

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

    // Home route component
    const HomeContent = (
        <div
            className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden"
            style={{
                "--primary-color": theme.primaryColor,
                "--secondary-color": theme.secondaryColor,
            } as React.CSSProperties}
        >
            <Aurora
                colorStops={[theme.primaryColor, theme.secondaryColor, "#FF3232"]}
                blend={0.5}
                amplitude={3.0}
                speed={0.7}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-start mt-24 sm:mt-28 md:mt-32 p-4 sm:p-6 md:p-8">
                <div className="w-full sm:w-4/5 md:w-3/5 mx-auto">
                    <div className="flex justify-start -mt-28 mb-1">
                        <Logo size={120} />
                    </div>
                    {/* Create Task Button for Small Screens */}
                    {isSmallScreen && (
                        <div className="w-full mb-4">
                            <Button
                                onClick={() => setShowTodoForm(!showTodoForm)}
                                className={`w-full py-3 flex items-center justify-center gap-2 bg-black text-white rounded-lg shadow-md transition-all duration-300 ${showTodoForm ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
                            >
                                {showTodoForm ? (
                                    <>
                                        <X className="w-5 h-5" />
                                        <span>Close</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        <ShinyText text="Create a Task" disabled={false} speed={2} className='text-white font-medium' />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* TodoForm - shown by default on large screens, toggled on small screens */}
                    <AnimatePresence>
                        {(!isSmallScreen || (isSmallScreen && showTodoForm)) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <TodoForm />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <TodoList />
                    <Toaster />
                </div>
            </div>

            {/* Analytics panel for large screens */}
            {isLargeScreen && (
                <div className="fixed top-16 right-0 max-h-full w-72 lg:w-80 p-4 overflow-y-auto z-10 pr-5">
                    <div className="space-y-4">
                        <TaskAnalytics />
                        <ProductivityTrends />
                    </div>
                </div>
            )}

            {/* Slide-in analytics panel for smaller screens */}
            <AnimatePresence>
                {showAnalytics && !isLargeScreen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAnalytics(false)}
                    >
                        <motion.div
                            className="w-full sm:w-96 md:w-[400px] bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black h-full p-4 overflow-y-auto"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 px-2">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analytics Dashboard</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowAnalytics(false)}
                                    className="rounded-full h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-800"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="space-y-4 px-1">
                                <TaskAnalytics />
                                <ProductivityTrends />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );

    return (
        <>
            <NavBar />
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
                                    colorStops={[theme.primaryColor, theme.secondaryColor, "#FF3232"]}
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
                            {HomeContent}
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
        </>
    );
};

export default React.memo(App);