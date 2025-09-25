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
import { Toaster } from "./components/ui/toaster";
import { fetchSubtasks, fetchTasks } from "./services/taskService.ts";
import NotFound from "./components/NotFound";
import Aurora from "./components/ui/AuroraBG.tsx";
import UserProfile from "./components/UserProfile";
import SplitText from "./components/ui/SplitText.jsx";
import Footer from "./components/ui/Footer";
import { useSessionRecording } from './hooks/useSessionRecording';
import { checkExistingSession, cleanupDuplicateSessions, subscribeToSessionRevocation, signOutAndCleanup } from './lib/sessionUtils';
import { Button } from "./components/ui/button.tsx";
import GradientText from "./components/ui/GradientText";
import NavBar from "./components/NavBar";
import { IdleTimeoutGuard } from "./components/IdleTimeoutGuard";
import { initializeTheme } from "./lib/themeUtils";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { supabase } from "./lib/supabaseClient";
import { useToast } from "./hooks/use-toast";
import { Link } from "react-router-dom";
import type { Todo } from "./types";
import { pomodoroService } from "./services/pomodoroService";
import { useBillingStore, initializeFreeTierSubscription } from "./store/billingStore";
import ResetPasswordForm from "./components/ResetPasswordForm";

const AnalyticsDashboard = lazy(() => import("./components/AnalyticsDashboard"));

const App: React.FC = () => {
    const { theme, setTodos, setUserToken, setTheme } = useTodoStore();
    const { setSubscription } = useBillingStore();
    const [session, setSession] = useState<Session | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showTodoForm, setShowTodoForm] = useState(false);
    const { toast } = useToast();

    // Init theme
    useEffect(() => {
        // Init from store
        initializeTheme(theme);

        // Force dark class
        document.documentElement.classList.toggle('dark', theme.mode === 'dark');
    }, [theme]);

    // Watch system theme
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Only if no manual pick
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            // Has saved prefs?
            if (localStorage.getItem('todo-storage')) {
                const storedData = JSON.parse(localStorage.getItem('todo-storage') || '{}');
                // Skip if user chose
                if (!storedData.state?.theme?.mode) {
                    setTheme({
                        ...theme,
                        mode: e.matches ? 'dark' : 'light',
                    });
                }
            } else {
                // No prefs? follow system
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

    // Listen NavBar toggle
    useEffect(() => {
        const handleToggleAnalytics = () => {
            setShowAnalytics(prev => !prev);
        };

        window.addEventListener('toggleAnalytics', handleToggleAnalytics);

        return () => {
            window.removeEventListener('toggleAnalytics', handleToggleAnalytics);
        };
    }, []);

    // Auth listener (separate)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);

            if (session) {
                // Save token now
                sessionStorage.setItem("token", session.access_token || "");
                setUserToken(session.access_token || "");

                // Do background stuff (skip on reset-password route)
                Promise.resolve().then(async () => {
                    try {
                        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
                        if (!pathname.startsWith('/reset-password')) {
                            await checkExistingSession();
                            if (session.user?.id) {
                                await cleanupDuplicateSessions(session.user.id);
                                // Init free sub
                                const freeSubscription = initializeFreeTierSubscription(session.user.id);
                                setSubscription(freeSubscription);
                            }
                        }
                    } catch (error) {
                        console.warn('Session initialization background task:', error);
                    }
                });
            } else {
                await signOutAndCleanup({ scope: 'local' });
            }

            // Auth check done
            setIsAuthChecking(false);
        });

        // Initial check
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setIsAuthChecking(false);
        });

        return () => subscription.unsubscribe();
    }, [setUserToken]);

    // Load user data (separate)
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

        // Run in parallel
        Promise.all([fetchUser(), fetchProfileImage()])
            .catch(error => console.error("Error fetching user data:", error));

    }, [session]);

    // Watch revoke events
    useEffect(() => {
        if (!session) return;
        const unsubscribe = subscribeToSessionRevocation(session);
        const safeUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : () => { /* noop */ };
        return () => {
            try {
                safeUnsubscribe();
            } catch (err) {
                console.error('Error unsubscribing session revocation channel:', err);
            }
        };
    }, [session?.user?.id]);

    // Load data (separate)
    useEffect(() => {
        if (!session) {
            setIsDataLoaded(true);
            return;
        }

        const loadData = async () => {
            setIsDataLoaded(false);
            try {
                const userId = localStorage.getItem('userId') || (await supabase.auth.getUser()).data.user?.id;

                if (!userId) {
                    console.error("User ID not available");
                    setIsDataLoaded(true);
                    return;
                }

                try {
                    const tasks = await fetchTasks();

                    const tasksWithSubtasks = [];
                    const batchSize = 5;

                    for (let i = 0; i < (tasks || []).length; i += batchSize) {
                        const batch = (tasks || []).slice(i, i + batchSize);
                        const batchResults = await Promise.all(
                            batch.map(async (task) => {
                                // Guard: need id
                                if (!task || typeof task.id !== 'string') {
                                    console.error('Invalid task object:', task);
                                    return { ...task, subtasks: [] };
                                }
                                const subtasks = await fetchSubtasks(task.id);
                                return { ...task, subtasks: subtasks || [] };
                            })
                        );
                        tasksWithSubtasks.push(...batchResults);

                        if (i + batchSize < (tasks || []).length) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    }
                    setTodos(tasksWithSubtasks as unknown as Todo[]);
                } catch (error: unknown) {
                    console.error("Error loading data:", error);

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

    // For >1600px
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

    // Record sessions
    useSessionRecording();

    // Init pomodoro
    useEffect(() => {
        pomodoroService.initializeTable().catch(error => {
            console.warn('Could not initialize pomodoro table:', error);
        });
    }, []);

    // Lean loading UI
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

    // Let components handle loading

    // Home
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

            <div className={`pt-0 -mt-12 pb-8 px-4 sm:px-6 md:px-8 min-h-screen ${isLargeScreen ? 'xl:pr-80 2xl:pr-96' : ''}`}>
                <div className="max-w-5xl xl:max-w-6xl mx-auto h-full flex flex-col">
                    <div className="w-full flex-shrink-0 mb-4">
                        <Button
                            onClick={() => setShowTodoForm(!showTodoForm)}
                            className={`w-full py-3 flex items-center justify-center gap-2 bg-black text-white rounded-lg shadow-md transition-all duration-300 ${showTodoForm ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
                            aria-label="Create a Task"
                        >
                            {showTodoForm ? (
                                <>
                                    <X className="w-5 h-5" />
                                    <span>Close</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    <GradientText
                                        colors={
                                            theme.mode === 'dark'
                                                ? ["#000", "#0640ff", "#000"]
                                                : ["#fff", "#fc3811", "#fff"]
                                        }
                                        animationSpeed={8}
                                        innerClassName="drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)]"
                                    >
                                        <span className="text-lg font-bold">Create a Task</span>
                                    </GradientText>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Form at top when open */}
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

                    {/* List scrolls itself */}
                    <div className="flex-1 min-h-0">
                        <TodoList isLoading={!isDataLoaded} />
                    </div>
                </div>
            </div>

            {/* Analytics (large screens) */}
            {isLargeScreen && (
                <div className="fixed top-20 right-4 max-h-full w-72 lg:w-80 xl:w-80 2xl:w-96 p-4 overflow-y-auto z-10 pr-5">
                    <div className="space-y-4">
                        <Suspense fallback={<div>Loading Analytics...</div>}>
                            <AnalyticsDashboard />
                        </Suspense>
                    </div>
                </div>
            )}

            {/* Slide-in analytics (small) */}
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
            {session && <IdleTimeoutGuard idleMs={30 * 60 * 1000} warningMs={60 * 1000} />}
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
                    element={<Navigate to="/reset-password" replace />}
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
                                <div className="pt-0 pb-8 px-4 sm:px-6 md:px-8 min-h-screen">
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
                    path="/reset-password"
                    element={<ResetPasswordForm />}
                />

                <Route path="*" element={<><NotFound /></>} />
            </Routes>
        </>
    );
};

export default React.memo(App);