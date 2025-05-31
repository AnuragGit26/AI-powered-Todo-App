import { cn } from "../lib/utils";
import { Button } from "./ui/button.tsx";
import SplitText from './ui/SplitText';
import {
    Card,
    CardContent,
    CardDescription, CardFooter,
    CardHeader,
} from "./ui/card.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logActivity, updateUsageMetrics } from "../services/activityMetrics.ts";
import { getUserIP } from "../services/ipService.ts";
import Aurora from "./ui/AuroraBG.tsx";
import { TodoAIIntro } from "./TodoAIIntro";
import { motion } from "framer-motion";
import { recordSession } from '../lib/sessionUtils';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader } from "lucide-react";
import Logo from "./Logo";
import {
    Mail,
    Lock,
    Check,
    ArrowRight,
    Info
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const ModernFooter = () => {
    return (
        <motion.footer
            className="w-full py-8 backdrop-blur-sm bg-white/10 border-t dark:border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
        >
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    {/* Logo and tagline */}
                    <div className="mb-6 md:mb-0">
                        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary/90 to-purple-400 bg-clip-text text-transparent tracking-tight">
                            TaskMind AI
                        </h2>
                        <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                            Revolutionizing task management with AI-powered organization and insights.
                        </p>
                    </div>

                    {/* Quick links */}
                    {/*<div className="grid grid-cols-2 gap-8 mb-6 md:mb-0">*/}
                    {/*    <div>*/}
                    {/*        <h4 className="text-sm font-medium mb-2">Product</h4>*/}
                    {/*        <ul className="space-y-2 text-xs text-muted-foreground">*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">API</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>*/}
                    {/*        </ul>*/}
                    {/*    </div>*/}
                    {/*    <div>*/}
                    {/*        <h4 className="text-sm font-medium mb-2">Company</h4>*/}
                    {/*        <ul className="space-y-2 text-xs text-muted-foreground">*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">About</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>*/}
                    {/*            <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>*/}
                    {/*        </ul>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {/* Social icons */}
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-center md:text-right">Connect</h4>
                        <div className="flex space-x-4 justify-center md:justify-end">
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/anurag2604/" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
                    <div className="mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} TaskMind AI. All rights reserved.
                    </div>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-primary transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (value: string) => {
        if (!value.trim()) {
            setEmailError("Email is required");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setEmailError("Please enter a valid email address");
            return false;
        }

        setEmailError("");
        return true;
    };

    const validatePassword = (value: string) => {
        if (!value.trim()) {
            setPasswordError("Password is required");
            return false;
        }

        if (value.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            return false;
        }

        setPasswordError("");
        return true;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) validateEmail(value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (passwordError) validatePassword(value);
    };

    const handleGithubSignIn = async () => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
        });
        setLoading(false);
        if (error) {
            setErrorMessage('Error signing in with GitHub: ' + error.message);
        } else {
            setSuccessMessage('Successfully signed in with GitHub!');
            navigate("/");
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate inputs before submission
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        setLoading(false);
        if (error) {
            setErrorMessage('Error signing in: ' + error.message);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const ipAddress = await getUserIP();
                await logActivity(user.id, 'User logged in');
                await updateUsageMetrics(user.id, { last_login: new Date(), total_logins_inc: 1, ip_address: ipAddress });
            }
            await recordSession();
            setSuccessMessage('Successfully signed in!');
            navigate("/");
        }
    };

    const handleAnimationComplete = () => {
        console.log('All letters have animated!');
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-gray-950">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.8}
                amplitude={2.5}
                speed={0.7}
            />


            <div className={cn("flex-1 py-12 overflow-y-auto z-50", className)} {...props}>
                <div className="container max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Login form column */}
                        <motion.div
                            className="mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="backdrop-blur-md border border-white/20 dark:border-gray-800/50 shadow-2xl overflow-hidden bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white">
                                <CardHeader className="text-center pb-3">
                                    <SplitText
                                        text="Welcome back to TaskMind AI"
                                        className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                                        delay={70}
                                        animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                                        animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                                        easing="easeOutCubic"
                                        threshold={0.2}
                                        rootMargin="-50px"
                                        onLetterAnimationComplete={handleAnimationComplete}
                                    />
                                    <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                                        Continue your productivity journey with AI-powered task management
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {errorMessage && (
                                        <Alert variant="destructive" className="text-red-500 border-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300">
                                            <Info className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>{errorMessage}</AlertDescription>
                                        </Alert>
                                    )}
                                    {successMessage && (
                                        <Alert className="text-green-500 border-green-500 bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                                            <Check className="h-4 w-4" />
                                            <AlertTitle>Success</AlertTitle>
                                            <AlertDescription>{successMessage}</AlertDescription>
                                        </Alert>
                                    )}
                                    <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGithubSignIn}
                                            className="w-full flex items-center gap-2 justify-center bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white border-gray-700 hover:border-gray-600 transition-all duration-200"
                                        >
                                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                                            </svg>
                                            Continue with GitHub
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => console.log("Google sign in")}
                                            className="w-full flex items-center gap-2 justify-center bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white border-transparent transition-all duration-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                            </svg>
                                            Continue with Google
                                        </Button>

                                        <div className="relative flex items-center">
                                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                                            <span className="flex-shrink mx-4 text-sm text-gray-600 dark:text-gray-400">Or continue with email</span>
                                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Email address
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={handleEmailChange}
                                                    placeholder="you@example.com"
                                                    className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${emailError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                                />
                                            </div>
                                            {emailError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>}
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={handlePasswordChange}
                                                    placeholder="••••••••"
                                                    className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${passwordError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                >
                                                    {showPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {passwordError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{passwordError}</p>}
                                        </div>

                                        <div className="text-right">
                                            <a href="/password-reset-request" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                Forgot password?
                                            </a>
                                        </div>

                                        <Button
                                            disabled={loading}
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white py-2 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                <>
                                                    Sign In
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex flex-col space-y-4 pb-6">
                                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                        Don't have an account?{" "}
                                        <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
                                            Create one
                                        </a>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                        <motion.div
                            className="hidden md:block mb-8"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <TodoAIIntro />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Modern Footer */}
            <ModernFooter />
        </div>
    );
}

