import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "./ui/card";
import SplitText from "./ui/SplitText";
import LaserFlow from "./ui/LaserFlow.tsx";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader, Mail, Lock, Check, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import useIsMobile from "../hooks/useIsMobile";
import { useTodoStore } from "../store/todoStore";
import { getOptimizedDarkModeColor, getDarkModeColors } from "../lib/themeUtils";

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
    requirements: {
        length: boolean;
        lowercase: boolean;
        uppercase: boolean;
        number: boolean;
        special: boolean;
    };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let label = "Very Weak";
    let color = "text-red-500 dark:text-red-400";

    if (score === 5) {
        label = "Very Strong";
        color = "text-green-600 dark:text-green-400";
    } else if (score === 4) {
        label = "Strong";
        color = "text-green-500 dark:text-green-400";
    } else if (score === 3) {
        label = "Medium";
        color = "text-yellow-500 dark:text-yellow-400";
    } else if (score === 2) {
        label = "Weak";
        color = "text-orange-500 dark:text-orange-400";
    }

    return { score, label, color, requirements };
};

const ResetPasswordForm: React.FC = () => {
    const [mode, setMode] = useState<"request" | "reset">("request");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenVerified, setTokenVerified] = useState(false);
    const [verifyingToken, setVerifyingToken] = useState(true);

    // Validation state
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const { theme } = useTodoStore();
    const isDark = theme.mode === 'dark';
    const darkColors = getDarkModeColors();
    const laserColor = isDark
        ? getOptimizedDarkModeColor(theme.primaryColor || '#7C3AED', darkColors)
        : (theme.primaryColor || '#7C3AED');

    // Utility: promise timeout
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> => {
        let timer: number | undefined;
        const timeout = new Promise<never>((_, reject) => {
            // window.setTimeout type for TS in browser
            timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        });
        return Promise.race([promise, timeout]).finally(() => {
            if (timer) window.clearTimeout(timer);
        }) as Promise<T>;
    };

    // Check for recovery token in URL
    useEffect(() => {
        const checkRecoveryToken = async () => {
            setVerifyingToken(true);
            try {
                // Check URL hash for access_token (recovery flow)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');

                // Fast-path: if a valid session already exists, immediately allow reset
                const quickSession = await withTimeout(
                    supabase.auth.getSession(),
                    700,
                    'Session check'
                ).catch(() => ({ data: { session: null } } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>));

                if (quickSession?.data?.session) {
                    setMode('reset');
                    setTokenVerified(true);
                    setSuccess('Token verified! Please enter your new password.');
                    // Clean URL if hash present
                    if (window.location.hash) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                    return;
                }

                if (accessToken && type === 'recovery') {
                    // Verify the session with a timeout guard
                    const { data, error } = await withTimeout(
                        supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: hashParams.get('refresh_token') || '',
                        }),
                        5000,
                        'Token verification'
                    );

                    if (error) {
                        console.error('Token verification error:', error);
                        setError('Invalid or expired reset link. Please request a new one.');
                        setMode('request');
                        setTokenVerified(false);
                    } else if (data.session) {
                        setMode('reset');
                        setTokenVerified(true);
                        setSuccess('Token verified! Please enter your new password.');
                        // Clean URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                        setError('Failed to verify session. Please request a new link.');
                        setMode('request');
                        setTokenVerified(false);
                    }
                } else {
                    // No token, stay in request mode
                    setMode('request');
                    setTokenVerified(false);
                }
            } catch (err) {
                console.error('Error checking recovery token:', err);
                setError('Failed to verify reset link. Please try again.');
                setMode('request');
                setTokenVerified(false);
            } finally {
                setVerifyingToken(false);
            }
        };

        checkRecoveryToken();
    }, [location]);

    // Update password strength when password changes
    useEffect(() => {
        if (mode === 'reset' && password) {
            setPasswordStrength(calculatePasswordStrength(password));
        } else {
            setPasswordStrength(null);
        }
    }, [password, mode]);

    // Validation functions
    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email is required");
            return false;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
            setEmailError("Please enter a valid email address");
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

    const validateConfirmPassword = (value: string) => {
        if (!value) {
            setConfirmPasswordError("Please confirm your password");
            return false;
        }
        if (value !== password) {
            setConfirmPasswordError("Passwords do not match");
            return false;
        }
        setConfirmPasswordError(null);
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
        if (confirmPassword && confirmPasswordError) validateConfirmPassword(confirmPassword);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (confirmPasswordError) validateConfirmPassword(value);
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                throw error;
            }

            setSuccess('Password reset link sent! Please check your email.');
            setEmail('');
        } catch (err) {
            console.error('Password reset request error:', err);
            setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

        if (!isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        // Check password strength
        if (passwordStrength && passwordStrength.score < 3) {
            setError('Please choose a stronger password. Your password should meet at least 3 requirements.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error } = await withTimeout(
                supabase.auth.updateUser({
                    password: password,
                }),
                8000,
                'Password update'
            );

            if (error) {
                throw error;
            }

            setSuccess('Password updated successfully! Redirecting to login...');

            // Sign out and redirect to login
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Password reset error:', err);
            const message = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
            // Provide clearer guidance on timeouts
            setError(
                /timed out/i.test(message)
                    ? 'Taking longer than expected. Please check your connection and try again.'
                    : message
            );
        } finally {
            setLoading(false);
        }
    };

    // LaserFlow parameters
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
            flowSpeed: 0.28,
            horizontalBeamOffset: 0.18,
            verticalBeamOffset: 0.0,
            verticalSizing: 2.8,
            horizontalSizing: 0.85,
            fogIntensity: isDark ? 0.8 : 0.65,
            fogScale: 0.32,
            wispDensity: 1.4,
            wispSpeed: isDark ? 16.0 : 14.5,
            wispIntensity: isDark ? 7.2 : 5.5,
            flowStrength: isDark ? 0.40 : 0.30,
        };

    if (verifyingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
                <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-gray-950">
            <div className="absolute inset-0 pointer-events-none flex justify-center items-center" aria-hidden="true">
                <LaserFlow
                    color={laserColor}
                    {...laserProps}
                    decay={1.1}
                    falloffStart={1.2}
                    fogFallSpeed={0.6}
                    className="w-[100vw] h-[75vh] md:w-full md:h-full mix-blend-screen"
                />
            </div>

            <main id="main-content" role="main" aria-label="Main content" className="flex-1 py-12 overflow-y-auto z-50 flex items-center justify-center">
                <div className="container max-w-md mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="w-full backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-xl overflow-hidden bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded-2xl ring-1 ring-white/10">
                            <CardHeader className="text-center pb-3 px-6 pt-6 md:pt-8">
                                <div className="flex justify-center mb-4">
                                    <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20">
                                        <Shield className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <SplitText
                                    text={mode === 'request' ? 'Reset Your Password' : 'Create New Password'}
                                    className="text-2xl font-semibold text-center text-gray-900 dark:text-white"
                                    delay={70}
                                    animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                                    animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                                    easing="easeOutCubic"
                                    threshold={0.2}
                                    rootMargin="-50px"
                                />
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    {mode === 'request'
                                        ? 'Enter your email to receive a password reset link'
                                        : 'Enter your new password below'
                                    }
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 px-6 pb-6 md:px-8">
                                {error && (
                                    <Alert variant="destructive" className="text-red-500 border-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-300">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                {success && (
                                    <Alert className="text-green-500 border-green-500 bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                                        <Check className="h-4 w-4" />
                                        <AlertTitle>Success</AlertTitle>
                                        <AlertDescription>{success}</AlertDescription>
                                    </Alert>
                                )}

                                {mode === 'request' ? (
                                    <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
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
                                                    aria-required="true"
                                                    aria-invalid={emailError ? 'true' : 'false'}
                                                />
                                            </div>
                                            {emailError && (
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1" role="alert">
                                                    {emailError}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            disabled={loading}
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white py-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow duration-200"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Send Reset Link</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                                        <div className="grid gap-1">
                                            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                New Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={handlePasswordChange}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${passwordError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                                    aria-required="true"
                                                    aria-invalid={passwordError ? 'true' : 'false'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {passwordError && (
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1" role="alert">
                                                    {passwordError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid gap-1">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Confirm Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={handleConfirmPasswordChange}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    className={`pl-10 bg-white dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-primary/60 dark:focus:ring-primary/60 ${confirmPasswordError ? 'border-red-500 dark:border-red-500 focus:ring-red-500 dark:focus:ring-red-500' : ''}`}
                                                    aria-required="true"
                                                    aria-invalid={confirmPasswordError ? 'true' : 'false'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                            {confirmPasswordError && (
                                                <p className="text-xs text-red-500 dark:text-red-400 mt-1" role="alert">
                                                    {confirmPasswordError}
                                                </p>
                                            )}
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {password && passwordStrength && (
                                            <div className="space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Password Strength:
                                                    </span>
                                                    <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                                                        {passwordStrength.label}
                                                    </span>
                                                </div>

                                                {/* Strength Bar */}
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${passwordStrength.score === 5 ? 'bg-green-600' :
                                                            passwordStrength.score === 4 ? 'bg-green-500' :
                                                                passwordStrength.score === 3 ? 'bg-yellow-500' :
                                                                    passwordStrength.score === 2 ? 'bg-orange-500' :
                                                                        'bg-red-500'
                                                            }`}
                                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                                    />
                                                </div>

                                                {/* Requirements Checklist */}
                                                <div className="space-y-1.5 pt-2">
                                                    <div className={`flex items-center text-xs ${passwordStrength.requirements.length ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        <Check className={`h-3 w-3 mr-1.5 ${passwordStrength.requirements.length ? 'opacity-100' : 'opacity-40'}`} />
                                                        At least 8 characters
                                                    </div>
                                                    <div className={`flex items-center text-xs ${passwordStrength.requirements.lowercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        <Check className={`h-3 w-3 mr-1.5 ${passwordStrength.requirements.lowercase ? 'opacity-100' : 'opacity-40'}`} />
                                                        One lowercase letter
                                                    </div>
                                                    <div className={`flex items-center text-xs ${passwordStrength.requirements.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        <Check className={`h-3 w-3 mr-1.5 ${passwordStrength.requirements.uppercase ? 'opacity-100' : 'opacity-40'}`} />
                                                        One uppercase letter
                                                    </div>
                                                    <div className={`flex items-center text-xs ${passwordStrength.requirements.number ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        <Check className={`h-3 w-3 mr-1.5 ${passwordStrength.requirements.number ? 'opacity-100' : 'opacity-40'}`} />
                                                        One number
                                                    </div>
                                                    <div className={`flex items-center text-xs ${passwordStrength.requirements.special ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        <Check className={`h-3 w-3 mr-1.5 ${passwordStrength.requirements.special ? 'opacity-100' : 'opacity-40'}`} />
                                                        One special character (optional)
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            disabled={loading || !tokenVerified}
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white py-2 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                    <span>Updating Password...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Reset Password</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col space-y-4 px-6 pb-6 md:px-8">
                                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                    {mode === 'request' ? (
                                        <>
                                            Remember your password?{" "}
                                            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                Sign in
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                Back to Sign in
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default ResetPasswordForm;