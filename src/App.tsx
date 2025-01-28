import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo } from 'lucide-react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useTodoStore } from './store/todoStore';
import { BorderBeam } from "./components/ui/border-beam";
import { createClient, Session } from "@supabase/supabase-js";
import { LoginForm } from "./components/LoginForm";
import { SignUpForm } from "./components/SignupForm";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import {PasswordResetRequestForm} from "./components/PasswordResetRequestForm.tsx";
import { Toaster } from "./components/ui/toaster";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const App: React.FC = () => {
    const theme = useTodoStore((state) => state.theme);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme.mode === 'dark');
    }, [theme.mode]);

    useEffect(() => {
        if (session) {
            console.log(session.user);
        }
    }, [session]);

    return (
        <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/password-reset-request" element={<PasswordResetRequestForm />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute isAuthenticated={!!session}>
                        <div
                            className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 transition-colors duration-200
              relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background md:shadow-xl"
                            style={{
                                '--primary-color': theme.primaryColor,
                                '--secondary-color': theme.secondaryColor,
                            } as React.CSSProperties}
                        >
                            <BorderBeam size={400} duration={12} delay={9} />
                            <ThemeCustomizer />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-3xl mx-auto"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <ListTodo className="w-10 h-10 text-blue-500" />
                                    <h1 className="text-4xl font-bold">Todo List</h1>
                                </div>
                                <TodoForm />
                                <TodoList />
                                <Toaster />
                            </motion.div>
                        </div>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default React.memo(App);