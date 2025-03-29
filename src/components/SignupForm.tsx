import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "./ui/card";
import SplitText from "./ui/SplitText";
import Aurora from "./ui/AuroraBG.tsx";
import ShinyText from "./ui/ShinyText.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader, User, Mail, Lock, Check, Info, ArrowRight, UserCheck } from "lucide-react";
import Logo from "./Logo";
import { Badge } from "./ui/badge.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip.tsx";
import ASCIIText from "./ui/ASCIIText.tsx";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
                    <div className="mb-6 md:mb-0">
                        <Logo size={32} showText={true} />
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

export function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Validation state variables
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const navigate = useNavigate();

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { username: username },
                    redirectTo: `${window.location.origin}/`,
                },
            });
            if (error) {
                setError(error.message);
            } else {
                console.log("Sign up successful", data);
                setSuccess("Registration successful! Please check your email to confirm your account.");
                // Wait a bit before redirecting to login
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleAnimationComplete = () => {
        console.log("All letters have animated!");
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.7}
            />

            {/* Logo in top left corner */}
            <motion.div
                className="absolute top-6 left-6 z-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >

            </motion.div>

            <div className="absolute inset-0 flex items-center justify-center min-h-screen z-50">
                <div className="max-w-md w-full px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
                            <CardHeader className="text-center pb-3">
                                <SplitText
                                    text="Create an Account"
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
                                    Start your productivity journey today
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertTitle className="flex items-center">
                                                    <Info className="h-4 w-4 mr-2" />
                                                    Registration failed
                                                </AlertTitle>
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Alert variant="success" className="mb-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                                                <AlertTitle className="flex items-center">
                                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                                    Registration successful
                                                </AlertTitle>
                                                <AlertDescription>{success}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleSignUp} className="grid gap-5">
                                    <div>
                                        <Label
                                            htmlFor="username"
                                            className="text-sm font-medium flex items-center mb-1"
                                        >
                                            <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                            Username
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                id="username"
                                                placeholder="Choose a username"
                                                value={username}
                                                onChange={handleUsernameChange}
                                                className={`pl-3 pr-3 py-2 h-10 ${usernameError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
                                                required
                                            />
                                            <AnimatePresence>
                                                {username && !usernameError && (
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
                                            {usernameError && (
                                                <motion.p
                                                    className="text-sm text-red-500 mt-1"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    {usernameError}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-medium flex items-center mb-1"
                                        >
                                            <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                            Email address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                id="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={handleEmailChange}
                                                className={`pl-3 pr-3 py-2 h-10 ${emailError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"}`}
                                                required
                                            />
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
                                    <div>
                                        <Label
                                            htmlFor="password"
                                            className="text-sm font-medium flex items-center mb-1"
                                        >
                                            <Lock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                placeholder="Create a secure password"
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
                                        {/* Password strength indicator */}
                                        {password && !passwordError && (
                                            <motion.div
                                                className="mt-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div className="flex gap-1">
                                                    {Array.from({ length: 4 }).map((_, i) => {
                                                        const hasLowercase = /[a-z]/.test(password);
                                                        const hasUppercase = /[A-Z]/.test(password);
                                                        const hasNumber = /\d/.test(password);
                                                        const hasMinLength = password.length >= 8;
                                                        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
                                                        const hasLongLength = password.length >= 12;

                                                        // Calculate password strength
                                                        const isWeak = password.length >= 1 && (!hasMinLength || (!hasLowercase && !hasUppercase && !hasNumber));
                                                        const isGood = hasMinLength && ((hasLowercase && hasUppercase) || (hasLowercase && hasNumber) || (hasUppercase && hasNumber));
                                                        const isStrong = hasMinLength && hasLowercase && hasUppercase && hasNumber;
                                                        const isVeryStrong = isStrong && hasSpecialChar && hasLongLength;

                                                        // Determine if this segment should be active and its color
                                                        let isSegmentActive = false;
                                                        let color = "bg-gray-200 dark:bg-gray-700"; // default inactive

                                                        if (isVeryStrong) {
                                                            isSegmentActive = true; // All segments for very strong
                                                            color = "bg-purple-500"; // Purple for very strong
                                                        } else if (isStrong) {
                                                            isSegmentActive = true; // All segments for strong
                                                            color = "bg-green-500";
                                                        } else if (isGood) {
                                                            isSegmentActive = i < 3; // First three segments for good
                                                            if (isSegmentActive) color = "bg-amber-500";
                                                        } else if (isWeak) {
                                                            isSegmentActive = i < 1; // Only first segment for weak
                                                            if (isSegmentActive) color = "bg-red-500";
                                                        }

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${color}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 transition-all duration-300">
                                                    {(() => {
                                                        const hasLowercase = /[a-z]/.test(password);
                                                        const hasUppercase = /[A-Z]/.test(password);
                                                        const hasNumber = /\d/.test(password);
                                                        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
                                                        const hasLongLength = password.length >= 12;

                                                        if (password.length < 1) {
                                                            return "Enter a password";
                                                        } else if (password.length < 8) {
                                                            return <span className="text-red-500 font-medium">Weak: Password should be at least 8 characters</span>;
                                                        } else if (!hasLowercase || !hasUppercase || !hasNumber) {
                                                            return <span className="text-amber-500 font-medium">Good: Add lowercase, uppercase letters and numbers</span>;
                                                        } else if (!hasSpecialChar || !hasLongLength) {
                                                            return <span className="text-green-500 font-medium">Strong password!</span>;
                                                        } else {
                                                            return <span className="text-purple-500 font-medium">Very Strong: Perfect password!</span>;
                                                        }
                                                    })()}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={loading || !!usernameError || !!emailError || !!passwordError}
                                        className="w-full h-10 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md active:scale-95 transition-transform duration-75"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                                <ShinyText text="Creating account..." disabled={false} speed={4} className='' />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <ShinyText text="Sign Up!" disabled={false} speed={2} className='' />
                                            </div>
                                        )}
                                    </Button>
                                    <div className="text-center text-sm mt-2">
                                        <span className="text-muted-foreground">Already have an account?</span>{" "}
                                        <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                                            Sign in
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 pt-5 pb-5 px-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="text-center justify-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary w-full">
                                    <TooltipProvider>
                                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                                            By signing up, you agree to our{" "}
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
                </div>
            </div>
        </div>
    );
}
