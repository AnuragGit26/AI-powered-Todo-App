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
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { logActivity, updateUsageMetrics } from "../services/activityMetrics.ts";
import { getUserIP } from "../services/ipService.ts";
import Aurora from "./ui/AuroraBG.tsx";
import { TodoAIIntro } from "./TodoAIIntro";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

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
                        <Logo size={32} showText={true} className="text-white" />
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
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
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
                            <Card className="backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
                                <CardHeader className="text-center pb-3">
                                    <SplitText
                                        text="Hello!! Welcome back to TaskMind AI"
                                        className="text-2xl font-semibold text-center"
                                        delay={70}
                                        animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                                        animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                                        easing="easeOutCubic"
                                        threshold={0.2}
                                        rootMargin="-50px"
                                        onLetterAnimationComplete={handleAnimationComplete}
                                    />
                                    <CardDescription className="mt-2 text-muted-foreground">
                                        Continue your productivity journey
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <AnimatePresence mode="wait">
                                        {errorMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Alert variant="destructive" className="mb-4">
                                                    <AlertTitle className="flex items-center">
                                                        <Info className="h-4 w-4 mr-2" />
                                                        Sign in failed
                                                    </AlertTitle>
                                                    <AlertDescription>{errorMessage}</AlertDescription>
                                                </Alert>
                                            </motion.div>
                                        )}

                                        {successMessage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Alert variant="success" className="mb-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                                                    <AlertTitle className="flex items-center">
                                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                                        Success
                                                    </AlertTitle>
                                                    <AlertDescription>{successMessage}</AlertDescription>
                                                </Alert>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSignIn}>
                                        <div className="grid gap-5">
                                            <div className="flex flex-col gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="w-full relative group overflow-hidden transition-all duration-300"
                                                    onClick={handleGithubSignIn}
                                                    disabled={loading}
                                                >
                                                    <motion.span
                                                        className="absolute inset-0 bg-black/5 dark:bg-white/5 w-0 group-hover:w-full transition-all duration-300"
                                                        initial={false}
                                                        animate={{ width: loading ? "100%" : "0%" }}
                                                    />
                                                    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                    </svg>
                                                    <span>Continue with GitHub</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full relative group overflow-hidden transition-all duration-300"
                                                >
                                                    <motion.span
                                                        className="absolute inset-0 bg-black/5 dark:bg-white/5 w-0 group-hover:w-full transition-all duration-300"
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                                                        <path
                                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    <span>Continue with Google</span>
                                                </Button>
                                            </div>
                                            <div
                                                className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200 dark:after:border-neutral-800">
                                                <span className="relative z-10 bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                                                    Or continue with email
                                                </span>
                                            </div>
                                            <div className="grid gap-5">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="email"
                                                        className="text-sm font-medium flex items-center mb-1"
                                                    >
                                                        <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                        Email address
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            placeholder="you@example.com"
                                                            value={email}
                                                            onChange={handleEmailChange}
                                                            className={`pl-3 pr-3 py-2 h-10 ${emailError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
                                                            required
                                                        />
                                                        {/* Status indicator */}
                                                        <AnimatePresence>
                                                            {email && !emailError && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                                                >
                                                                    <Check className="h-4 w-4 text-green-500" />
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <AnimatePresence>
                                                        {emailError && (
                                                            <motion.p
                                                                className="text-sm text-red-500 mt-1"
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {emailError}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <div className="grid gap-2">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Label htmlFor="password" className="text-sm font-medium flex items-center">
                                                            <Lock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                            Password
                                                        </Label>
                                                        <a
                                                            href="/password-reset-request"
                                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                        >
                                                            Forgot password?
                                                        </a>
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            id="password"
                                                            type={showPassword ? "text" : "password"}
                                                            value={password}
                                                            onChange={handlePasswordChange}
                                                            className={`pl-3 pr-10 py-2 h-10 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        >
                                                            {showPassword ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                    <AnimatePresence>
                                                        {passwordError && (
                                                            <motion.p
                                                                className="text-sm text-red-500 mt-1"
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                            >
                                                                {passwordError}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md active:scale-95 transition-transform duration-75"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <div className="flex items-center justify-center">
                                                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                                                            <span>Signing in...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center">
                                                            <span className="mr-1">Sign In</span>
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </div>
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="text-center text-sm mt-2">
                                                <span className="text-muted-foreground">Don&apos;t have an account?</span>{" "}
                                                <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                                                    Create one
                                                </a>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="bg-gray-50 dark:bg-gray-800/50 pt-5 pb-5 px-6 border-t border-gray-100 dark:border-gray-800">
                                    <div className="text-center justify-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary w-full">
                                        <TooltipProvider>
                                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                                                By signing in, you agree to our{" "}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <a href="#" className="hover:text-primary transition-colors">
                                                            Terms of Service
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="w-60 text-xs">
                                                            Our terms of service outline the rules and guidelines for using TaskMind AI.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                {" and "}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <a href="#" className="hover:text-primary transition-colors">
                                                            Privacy Policy
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="w-60 text-xs">
                                                            Our privacy policy explains how we collect, use, and protect your personal information.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
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

