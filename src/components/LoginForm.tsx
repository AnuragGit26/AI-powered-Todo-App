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
import {
    Mail,
    Lock,
    Check,
    ArrowRight,
    Info
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export const ModernFooter = () => {
    return (
        <motion.footer
            className="w-full py-8 backdrop-blur-sm bg-background/10 border-t border-border/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
        >
            <div className="container-enterprise">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    {/* Logo and tagline */}
                    <div className="mb-6 md:mb-0">
                        <h2 className="text-responsive-lg font-bold bg-gradient-to-r from-primary/90 to-info bg-clip-text text-transparent tracking-tight">
                            TaskMind AI
                        </h2>
                        <p className="text-responsive-xs text-muted-foreground mt-2 max-w-xs">
                            Revolutionizing task management with AI-powered organization and insights.
                        </p>
                    </div>

                    {/* Social icons */}
                    <div>
                        <h4 className="text-responsive-sm font-medium mb-2 text-center md:text-right">Connect</h4>
                        <div className="flex space-x-4 justify-center md:justify-end">
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                            </a>
                            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="https://www.linkedin.com/in/anurag2604/" className="w-8 h-8 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border/10 flex flex-col md:flex-row justify-between items-center text-responsive-xs text-muted-foreground">
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
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
            <Aurora
                colorStops={["#3b82f6", "#6366f1", "#8b5cf6"]}
                blend={0.6}
                amplitude={2.5}
                speed={0.7}
            />

            <div className={cn("flex-1 py-responsive overflow-y-auto z-50", className)} {...props}>
                <div className="container-enterprise">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-start min-h-[calc(100vh-4rem)]">
                        {/* Login form column */}
                        <motion.div
                            className="flex flex-col justify-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="w-full max-w-md mx-auto xl:max-w-lg">
                                <Card className="enterprise-card-elevated glass-enterprise">
                                    <CardHeader className="text-center pb-6 pt-8">
                                        <SplitText
                                            text="Welcome back to TaskMind AI"
                                            className="text-3xl font-bold text-center text-gray-900 dark:text-white"
                                            delay={70}
                                            animationFrom={{ opacity: 0, transform: 'translate3d(0,50px,0)' }}
                                            animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                                            easing="easeOutCubic"
                                            threshold={0.2}
                                            rootMargin="-50px"
                                            onLetterAnimationComplete={handleAnimationComplete}
                                        />
                                        <CardDescription className="text-enterprise-large mt-3">
                                            Continue your productivity journey with AI-powered task management
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-6 pb-6 space-enterprise-lg">
                                        {errorMessage && (
                                            <Alert variant="destructive" className="status-error border">
                                                <Info className="h-4 w-4" />
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{errorMessage}</AlertDescription>
                                            </Alert>
                                        )}
                                        {successMessage && (
                                            <Alert className="status-success border">
                                                <Check className="h-4 w-4" />
                                                <AlertTitle>Success</AlertTitle>
                                                <AlertDescription>{successMessage}</AlertDescription>
                                            </Alert>
                                        )}
                                        <form onSubmit={handleSignIn} className="form-enterprise">
                                            <div className="space-enterprise-md">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleGithubSignIn}
                                                    className="btn-enterprise-outline w-full h-12 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white border-transparent hover:border-transparent transition-all duration-200"
                                                >
                                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3">
                                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor" />
                                                    </svg>
                                                    Continue with GitHub
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => console.log("Google sign in")}
                                                    className="btn-enterprise-outline w-full h-12 bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white border-transparent hover:border-transparent transition-all duration-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-3" fill="currentColor">
                                                        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                                                    </svg>
                                                    Continue with Google
                                                </Button>
                                            </div>

                                            <div className="relative flex items-center">
                                                <div className="flex-grow border-t border-border"></div>
                                                <span className="flex-shrink mx-4 text-responsive-sm text-muted-foreground">Or continue with email</span>
                                                <div className="flex-grow border-t border-border"></div>
                                            </div>

                                            <div className="form-group-enterprise">
                                                <Label htmlFor="email" className="form-label-enterprise">
                                                    Email address
                                                </Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={handleEmailChange}
                                                        placeholder="you@example.com"
                                                        className={`input-enterprise pl-10 h-12 ${emailError ? 'border-destructive focus:ring-destructive' : 'focus-enterprise'}`}
                                                    />
                                                </div>
                                                {emailError && <p className="text-responsive-xs text-destructive mt-1">{emailError}</p>}
                                            </div>

                                            <div className="form-group-enterprise">
                                                <Label htmlFor="password" className="form-label-enterprise">
                                                    Password
                                                </Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="••••••••"
                                                        className={`input-enterprise pl-10 pr-10 h-12 ${passwordError ? 'border-destructive focus:ring-destructive' : 'focus-enterprise'}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {passwordError && <p className="text-responsive-xs text-destructive mt-1">{passwordError}</p>}
                                            </div>

                                            <div className="text-right">
                                                <a href="/password-reset-request" className="text-responsive-sm text-primary hover:text-primary/80 hover:underline transition-colors">
                                                    Forgot password?
                                                </a>
                                            </div>

                                            <Button
                                                disabled={loading}
                                                type="submit"
                                                className="btn-enterprise-primary w-full h-12 bg-gradient-to-r from-primary via-info to-primary hover:from-primary/90 hover:via-info/90 hover:to-primary/90 shadow-md hover:shadow-lg transition-all duration-200 border-0"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader className="h-5 w-5 animate-spin mr-2" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    <>
                                                        Sign In
                                                        <ArrowRight className="w-5 h-5 ml-2" />
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                    <CardFooter className="flex flex-col space-enterprise-md pb-8">
                                        <div className="text-center text-responsive-sm text-muted-foreground">
                                            Don't have an account?{" "}
                                            <a href="/signup" className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium">
                                                Create one
                                            </a>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </motion.div>

                        {/* Feature showcase column */}
                        <motion.div
                            className="hidden xl:flex flex-col justify-center"
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

