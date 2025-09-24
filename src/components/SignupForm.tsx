import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "./ui/card";
import SplitText from "./ui/SplitText";
import LaserFlow from "./ui/LaserFlow.tsx";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader, Mail, Lock, Check, Info, ArrowRight, UserCheck, Github } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { Separator } from "./ui/separator";
import useIsMobile from "../hooks/useIsMobile";
import { useTodoStore } from "../store/todoStore";
import { getOptimizedDarkModeColor, getDarkModeColors } from "../lib/themeUtils";

export function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    // Validation state variables
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { theme } = useTodoStore();
    const isDark = theme.mode === 'dark';
    const darkColors = getDarkModeColors();
    const laserColor = isDark
        ? getOptimizedDarkModeColor(theme.secondaryColor || '#6366F1', darkColors)
        : (theme.secondaryColor || '#6366F1');

    // Validation functions
    const validateUsername = (value: string) => {
        if (!value) {
            setUsernameError("Username is required");
            return false;
        }
        if (value.length < 3) {
            setUsernameError("Username must be at least 3 characters");
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setUsernameError("Username can only contain letters, numbers and underscores");
            return false;
        }
        setUsernameError(null);
        return true;
    };

    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email is required");
            return false;
        }
        // More comprehensive email validation that matches Supabase's requirements
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
            setEmailError("Please enter a valid email address");
            return false;
        }
        // Additional check for common invalid patterns
        if (value.includes('+') && !value.includes('@')) {
            setEmailError("Email address with '+' must include a domain (e.g., user+tag@example.com)");
            return false;
        }
        setEmailError(null);
        return true;
    };

    const validatePassword = (value: string) => {
        if (!value) {
            setPasswordError("Password is required");
            return false;
        }
        if (value.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return false;
        }
        if (!/(?=.*[a-z])/.test(value)) {
            setPasswordError("Password must contain at least one lowercase letter");
            return false;
        }
        if (!/(?=.*[A-Z])/.test(value)) {
            setPasswordError("Password must contain at least one uppercase letter");
            return false;
        }
        if (!/(?=.*\d)/.test(value)) {
            setPasswordError("Password must contain at least one number");
            return false;
        }
        setPasswordError(null);
        return true;
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUsername(value);
        validateUsername(value);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        validateEmail(value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validate all fields before submission
        const isUsernameValid = validateUsername(username);
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
            setLoading(false);
            return;
        }

        try {
            console.log("Attempting signup with:", { email, username });

            // Create the auth user - profile will be created automatically by the database trigger
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username
                    },
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });

            if (error) {
                console.error("Signup error details:", error);

                if (error.message.includes('already registered')) {
                    setError('This email is already registered. Please try logging in or use a different email.');
                } else if (error.message.includes('invalid email')) {
                    setError('Please enter a valid email address (e.g., user@example.com)');
                } else if (error.message.includes('password')) {
                    setError('Password does not meet requirements. Please ensure it has at least 8 characters, including uppercase, lowercase, and numbers.');
                } else {
                    setError(error.message);
                }
                return;
            }

            // Check if user was created successfully
            if (!data?.user) {
                setError("Failed to create user account. Please try again.");
                return;
            }

            setSuccess("Registration successful! Please check your email to confirm your account.");
            console.log("Sign up successful", data);
            if (import.meta.env.MODE !== 'test') {
                setTimeout(() => {
                    navigate("/login");
                }, 1000);
            }

        } catch (err: Error | unknown) {
            console.error("Unexpected signup error:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSignUp = async () => {
        try {
            setGithubLoading(true);
            setError(null);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            });

            if (error) {
                throw error;
            }

        } catch (err) {
            console.error("GitHub signup error:", err);
            setError(err instanceof Error ? err.message : "Failed to sign up with GitHub");
        } finally {
            setGithubLoading(false);
        }
    };

    // LaserFlow parameters: tuned per theme mode and viewport for readability and performance
    const laserProps = isMobile
        ? {
            dpr: 1,
            flowSpeed: 0.26,
            horizontalBeamOffset: 0.0,
            verticalBeamOffset: 0.0,
            verticalSizing: 2.4,
            horizontalSizing: 0.7,
            fogIntensity: isDark ? 0.6 : 0.45,
            fogScale: 0.4,
            wispDensity: 1.0,
            wispSpeed: isDark ? 12.0 : 11.0,
            wispIntensity: isDark ? 5.0 : 3.5,
            flowStrength: isDark ? 0.30 : 0.23,
        }
        : {
            flowSpeed: 0.35,
            horizontalBeamOffset: 0.18,
            verticalBeamOffset: 0.0,
            verticalSizing: 2.8,
            horizontalSizing: 0.85,
            fogIntensity: isDark ? 0.8 : 0.65,
            fogScale: 0.5,
            wispDensity: 1.4,
            wispSpeed: isDark ? 16.0 : 14.5,
            wispIntensity: isDark ? 7.2 : 5.5,
            flowStrength: isDark ? 0.45 : 0.35,
        };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-gray-950">
            <div className="absolute inset-0 pointer-events-none flex justify-center items-center md:justify-end md:items-stretch" aria-hidden="true">
                <LaserFlow
                    color={laserColor}
                    {...laserProps}
                    decay={1.1}
                    falloffStart={1.2}
                    fogFallSpeed={0.6}
                    className="w-[100vw] h-[75vh] md:w-full md:h-full mix-blend-screen"
                />
            </div>

            <div className="flex-1 py-10 md:py-12 overflow-y-auto z-50">
                <div className="container max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center md:items-start min-h-[calc(100vh-8rem)]">
                    {/* Sign Up Form */}
                    <motion.div
                        className="w-full max-w-[520px] mx-auto md:justify-self-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="w-full backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded-2xl ring-1 ring-white/10">
                            <CardHeader className="text-center pb-3 px-6 pt-6 md:pt-8">
                                <SplitText
                                    text="Create your TaskMind account"
                                    className="text-2xl font-semibold text-center text-gray-900 dark:text-white"
                                    delay={70}
                                    animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                                    animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                                    easing="easeOutCubic"
                                    threshold={0.2}
                                    rootMargin="-50px"
                                />
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    Start your productivity journey today
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 px-6 pb-6 md:px-8">
                                {error && (
                                    <Alert variant="destructive" className="text-red-500 border-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300">
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                {success && (
                                    <Alert data-testid="success-message" className="text-green-500 border-green-500 bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                                        <Check className="h-4 w-4" />
                                        <AlertTitle>Success</AlertTitle>
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                                    onClick={handleGithubSignUp}
                                    disabled={githubLoading}
                                >
                                    {githubLoading ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting to GitHub...
                                        </>
                                    ) : (
                                        <>
                                            <Github className="mr-2 h-4 w-4" />
                                            Continue with GitHub
                                        </>
                                    )}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                                            Or continue with email
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                                    <div className="grid gap-1">
                                        <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Username
                                        </Label>
                                        <div className="relative">
                                            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                                            <Input
                                                id="username"
                                                type="text"
                                                placeholder="Choose a username"
                                                value={username}
                                                onChange={handleUsernameChange}
                                                className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${usernameError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {usernameError && (
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{usernameError}</p>
                                        )}
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
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={handleEmailChange}
                                                className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${emailError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                            />
                                        </div>
                                        {emailError && (
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{emailError}</p>
                                        )}
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
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={handlePasswordChange}
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
                                        {passwordError && (
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{passwordError}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 mt-2">
                                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Password requirements:</div>
                                        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                                            <div className={`flex items-center ${password.length >= 8 ? 'text-green-500 dark:text-green-400' : ''}`}>
                                                <Check className={`h-3 w-3 mr-1 ${password.length >= 8 ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                At least 8 characters
                                            </div>
                                            <div className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                                                <Check className={`h-3 w-3 mr-1 ${/[a-z]/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                One lowercase letter
                                            </div>
                                            <div className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                                                <Check className={`h-3 w-3 mr-1 ${/[A-Z]/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                One uppercase letter
                                            </div>
                                            <div className={`flex items-center ${/\d/.test(password) ? 'text-green-500 dark:text-green-400' : ''}`}>
                                                <Check className={`h-3 w-3 mr-1 ${/\d/.test(password) ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                One number
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full mt-2 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white py-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow duration-200"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="h-4 w-4 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            <>
                                                Create Account
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4 px-6 pb-6 md:px-8">
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        Sign in
                                    </Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                    <div className="hidden md:block" />
                </div>
            </div>
        </div>
    );
}
