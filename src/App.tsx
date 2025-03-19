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

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App: React.FC = () => {
    const theme = useTodoStore((state) => state.theme);
    const [session, setSession] = useState<Session | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { setTodos, setUserToken, setUserData } = useTodoStore();
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                localStorage.setItem("token", session.access_token || "");
                setUserToken(session.access_token || "");
                setIsDataLoaded(false);
            } else {
                setIsDataLoaded(true);
            }
        });
        return () => subscription.unsubscribe();
    }, [setUserToken]);

    useEffect(() => {
        if (!session) return;
        const loadData = async () => {
            try {
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
    }, [session, setTodos]);

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
            const bucketName = "MultiMedia Bucket";
            const newFilePath = `${userId}/profile.JPG`;
            if (userId) {
                const { data } = supabase.storage.from(bucketName).getPublicUrl(newFilePath);
                setPreview(data.publicUrl);
                localStorage.setItem("profilePicture", data.publicUrl);
                setUserData({ userId, profilePicture: data.publicUrl });
            }
        };
        fetchProfileImage();
    }, [setUserData]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme.mode === "dark");
    }, [theme.mode]);

    const handleAnimationComplete = () => {
        console.log("All letters have animated!");
    };

    if (!isDataLoaded) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <p className="text-xl text-gray-700 dark:text-gray-300">
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
                </p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/password-reset-request" element={<PasswordResetRequestForm />} />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute isAuthenticated={localStorage.getItem("token") != null}>
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
                        </div>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute isAuthenticated={localStorage.getItem("token") != null}>
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
                                <ProductivityTrends/>
                            </div>
                        </div>
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default React.memo(App);