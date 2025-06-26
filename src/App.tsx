import React, { useEffect, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import TodoForm from "./components/TodoForm";
import TodoList from "./components/TodoList";
import { useTodoStore } from "./store/todoStore";
import { Session } from "@supabase/supabase-js";
import { LoginForm } from "./components/LoginForm";
import { SignUpForm } from "./components/SignupForm";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { PasswordResetRequestForm } from "./components/PasswordResetRequestForm";
import { Toaster } from "./components/ui/toaster";
import { fetchSubtasks, fetchTasks } from "./services/taskService.ts";
import NotFound from "./components/NotFound";
import Aurora from "./components/ui/AuroraBG.tsx";
import UserProfile from "./components/UserProfile";
import SplitText from "./components/ui/SplitText.jsx";
import Footer from "./components/ui/Footer";
import { useSessionRecording } from './hooks/useSessionRecording';
import { checkExistingSession, cleanupDuplicateSessions } from './lib/sessionUtils';
import { Button } from "./components/ui/button.tsx";
import GradientText from "./components/ui/GradientText";
import NavBar from "./components/NavBar";
import { initializeTheme } from "./lib/themeUtils";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { supabase } from "./lib/supabaseClient";
import { useToast } from "./hooks/use-toast";
import { Link } from "react-router-dom";
import type { Todo } from "./types";
import { pomodoroService } from "./services/pomodoroService";
import { useBillingStore, initializeFreeTierSubscription } from "./store/billingStore";

const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard"));

const App: React.FC = () => {
    const { theme, setTodos, setUserToken, setTheme, calculateAllPriorityScores, setUserData } = useTodoStore();
    const { setSubscription } = useBillingStore();
    const [session, setSession] = useState<Session | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showTodoForm, setShowTodoForm] = useState(false);
    const [isAutoCalculating, setIsAutoCalculating] = useState(false);
    const { toast } = useToast();

    // Initialize theme on first load and whenever theme changes
    useEffect(() => {
        // Initialize theme with current settings from store
        initializeTheme(theme);

        // Add dark class to ensure UI components reflect the current theme
        document.documentElement.classList.toggle('dark', theme.mode === 'dark');
    }, [theme]);

    // Add listener for system color scheme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Only apply system preference if user hasn't manually set a theme
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            // If we have a stored preference, don't automatically change
            if (localStorage.getItem('todo-storage')) {
                const storedData = JSON.parse(localStorage.getItem('todo-storage') || '{}');
                // Only apply system change if user hasn't explicitly chosen a theme
                if (!storedData.state?.theme?.mode) {
                    setTheme({
                        ...theme,
                        mode: e.matches ? 'dark' : 'light',
                    });
                }
            } else {
                // No stored preference, follow system
                setTheme({
                    ...theme,
                    mode: e.matches ? 'dark' : 'light',
                });
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
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

    // Auth state listener - separated from data loading for performance
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);

            if (session) {
                // Store token immediately
                sessionStorage.setItem("token", session.access_token || "");
                setUserToken(session.access_token || "");

                // Start session operations in the background
                Promise.resolve().then(async () => {
                    try {
                        await checkExistingSession();
                        if (session.user?.id) {
                            await cleanupDuplicateSessions(session.user.id);
                            // Initialize billing subscription for new users
                            const freeSubscription = initializeFreeTierSubscription(session.user.id);
                            setSubscription(freeSubscription);
                        }
                    } catch (error) {
                        console.warn('Session initialization background task:', error);
                    }
                });
            }

            // Mark auth check as complete
            setIsAuthChecking(false);
        });

        // Initial auth check
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setIsAuthChecking(false);
        });

        return () => subscription.unsubscribe();
    }, [setUserToken]);

    // User data loading - separate from auth for performance
    useEffect(() => {
        if (!session) return;

        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                localStorage.setItem("username", user.user_metadata.username);
                localStorage.setItem("userId", user.id);
            }
        };

        const fetchProfileImage = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;
            if (!userId) return;

            const bucketName = "MultiMedia Bucket";
            const filePath = `${userId}/profile.jpg`;
            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            localStorage.setItem("profilePicture", data.publicUrl);
        };

        // Run these concurrently
        Promise.all([fetchUser(), fetchProfileImage()])
            .catch(error => console.error("Error fetching user data:", error));

    }, [session]);

    // Data loading - separate effect to avoid blocking UI
    useEffect(() => {
        if (!session) {
            setIsDataLoaded(true);
            return;
        }

        const loadData = async () => {
            try {
                // Get current userId 
                const userId = localStorage.getItem('userId') || (await supabase.auth.getUser()).data.user?.id;

                if (!userId) {
                    console.error("User ID not available");
                    setIsDataLoaded(true);
                    return;
                }

                try {
                    // Fetch tasks and subtasks concurrently
                    const tasks = await fetchTasks();

                    // Process in batches to avoid UI freezing
                    const tasksWithSubtasks = [];
                    const batchSize = 5;

                    for (let i = 0; i < (tasks || []).length; i += batchSize) {
                        const batch = (tasks || []).slice(i, i + batchSize);
                        const batchResults = await Promise.all(
                            batch.map(async (task) => {
                                // Ensure task has an id before trying to fetch subtasks
                                if (!task || typeof task.id !== 'string') {
                                    console.error('Invalid task object:', task);
                                    return { ...task, subtasks: [] };
                                }
                                const subtasks = await fetchSubtasks(task.id);
                                return { ...task, subtasks: subtasks || [] };
                            })
                        );
                        tasksWithSubtasks.push(...batchResults);

                        // Allow UI to breathe between batches
                        if (i + batchSize < (tasks || []).length) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    }

                    // Type assertion to handle the subtasks correctly
                    setTodos(tasksWithSubtasks as unknown as Todo[]);
                } catch (error: unknown) {
                    console.error("Error loading data:", error);

                    // Check if it's the lastRecurrenceDate error
                    const errorObj = error as {
                        message?: string;
                        details?: string;
                        code?: string
                    };

                    const errorMessage = String(errorObj?.message || '');
                    const errorDetails = String(errorObj?.details || '');

                    if (errorMessage.includes('lastRecurrenceDate') ||
                        errorDetails.includes('lastRecurrenceDate') ||
                        (errorObj?.code === 'PGRST204' && errorMessage.includes('column'))) {

                        // setDbMigrationNeeded(true);

                        toast({
                            title: "Database Update Required",
                            description: "Your database needs to be updated. Please go to the Database Migration page.",
                            variant: "destructive",
                            duration: 10000,
                            action: (
                                <Link to="/db-migration">
                                    <Button variant="outline">Update Now</Button>
                                </Link>
                            ),
                        });
                    }
                }

                setIsDataLoaded(true);
            } catch (err) {
                console.error("Error in data loading:", err);
                setIsDataLoaded(true);
            }
        };

        loadData();
    }, [session, setTodos, toast]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme.mode === "dark");
    }, [theme.mode]);

    const handleAnimationComplete = () => {
        console.log("All letters have animated!");
    };

    // Media query for screens larger than 1600px
    const [isLargeScreen, setIsLargeScreen] = useState(false);

    useEffect(() => {
        const largeMediaQuery = window.matchMedia('(min-width: 1600px)');

        setIsLargeScreen(largeMediaQuery.matches);

        const handleLargeResize = (e: MediaQueryListEvent) => {
            setIsLargeScreen(e.matches);
        };

        largeMediaQuery.addEventListener('change', handleLargeResize);

        return () => {
            largeMediaQuery.removeEventListener('change', handleLargeResize);
        };
    }, []);

    // Record user sessions when logged in
    useSessionRecording();

    // Initialize pomodoro service
    useEffect(() => {
        pomodoroService.initializeTable().catch(error => {
            console.warn('Could not initialize pomodoro table:', error);
        });
    }, []);

    // Show a more streamlined loading state
    if (isAuthChecking && !isDataLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 md:px-8">
                <div className="text-xl sm:text-2xl md:text-3xl text-center text-gray-700 dark:text-gray-300 responsive-text">
                    <SplitText
                        text="Setting up things for you"
                        className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center responsive-text"
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

    // Don't show the loading screen for data loading, let the UI render and show loading indicators in components

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
                blend={0.7}
                amplitude={2.5}
                speed={0.9}
            />

            <div className="pt-20 pb-8 px-4 sm:px-6 md:px-8 min-h-screen">
                <div className="max-w-4xl mx-auto h-full flex flex-col">
                    {/* Create Task Button for All Screens - Fixed at top */}
                    <div className="w-full flex-shrink-0 mb-4">
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
                                    <GradientText colors={["#ffaa40", "#9c40ff", "#ffaa40"]} animationSpeed={8}>
                                        Create a Task
                                    </GradientText>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* TodoForm - positioned at top when shown */}
                    <AnimatePresence>
                        {showTodoForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex-shrink-0 overflow-hidden mb-4"
                            >
                                <TodoForm onSubmitSuccess={() => setShowTodoForm(false)} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* TodoList - scrollable container */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <TodoList isLoading={!isDataLoaded} />
                    </div>
                </div>
            </div>

            {/* Analytics panel for large screens */}
            {isLargeScreen && (
                <div className="fixed top-16 right-0 max-h-full w-72 lg:w-80 p-4 overflow-y-auto z-10 pr-5">
                    <div className="space-y-4">
                        <Suspense fallback={<div>Loading Analytics...</div>}>
                            <AnalyticsDashboard />
                        </Suspense>
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
                                <Suspense fallback={<div>Loading Analytics...</div>}>
                                    <AnalyticsDashboard />
                                </Suspense>
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
            <Toaster />
            <Routes>
                <Route
                    path="/login"
                    element={
                        session ? <Navigate to="/" replace /> : <><LoginForm /></>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        session ? <Navigate to="/" replace /> : <><SignUpForm /></>
                    }
                />
                <Route
                    path="/password-reset-request"
                    element={
                        session ? <Navigate to="/" replace /> : <><PasswordResetRequestForm /></>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute isAuthenticated={!!session}>
                            <div
                                className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden"
                                style={{
                                    "--primary-color": theme.primaryColor,
                                    "--secondary-color": theme.secondaryColor,
                                } as React.CSSProperties}
                            >
                                <Aurora
                                    colorStops={[theme.primaryColor, theme.secondaryColor, "#FF3232"]}
                                    blend={0.7}
                                    amplitude={2.5}
                                    speed={0.9}
                                />
                                <div className="pt-20 pb-8 px-4 sm:px-6 md:px-8 min-h-screen">
                                    {session?.user && <UserProfile userData={session.user} />}
                                </div>
                                <Footer />
                            </div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute isAuthenticated={!!session}>
                            {HomeContent}
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pomodoro"
                    element={
                        <ProtectedRoute isAuthenticated={!!session}>
                            <div
                                className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-auto"
                                style={{
                                    "--primary-color": theme.primaryColor,
                                    "--secondary-color": theme.secondaryColor,
                                } as React.CSSProperties}
                            >
                                <Aurora
                                    colorStops={[theme.primaryColor, theme.secondaryColor, "#FF3232"]}
                                    blend={0.7}
                                    amplitude={2.5}
                                    speed={0.9}
                                />
                                <div className="pt-20 pb-8 px-4 sm:px-6 md:px-8 min-h-screen">
                                    <div className="max-w-2xl mx-auto">
                                        <PomodoroTimer />
                                    </div>
                                </div>
                                <Footer />
                            </div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="reset-password"
                    element={
                        session ? <Navigate to="/" /> : <PasswordResetRequestForm />
                    }
                />

                <Route path="*" element={<><NotFound /></>} />
            </Routes>
        </>
    );
};

export default React.memo(App);