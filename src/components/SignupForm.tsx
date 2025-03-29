import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import SplitText from "./ui/SplitText";
import Aurora from "./ui/AuroraBG.tsx";
import ShinyText from "./ui/ShinyText.tsx";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader } from "lucide-react";
import Logo from "./Logo";

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
                    {/* Logo and tagline */}
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
            <div className="absolute inset-0 flex items-center justify-center min-h-screen z-50">
                <div className="max-w-md w-full px-4">
                    <Card>
                        <CardHeader className="text-center">
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
                            <CardDescription>
                                Please fill in the details to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" className="mb-4 animate-in fade-in-50 slide-in-from-top-5">
                                    <AlertTitle>Registration failed</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert variant="success" className="mb-4 animate-in fade-in-50 slide-in-from-top-5">
                                    <AlertTitle>Registration successful</AlertTitle>
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSignUp} className="grid gap-6">
                                <div>
                                    <Label htmlFor="username" className="block text-sm font-medium mb-2">
                                        Username:
                                    </Label>
                                    <Input
                                        type="text"
                                        id="username"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={handleUsernameChange}
                                        className={usernameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                    {usernameError && (
                                        <p className="text-red-500 text-xs mt-1">{usernameError}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="email" className="block text-sm font-medium mb-2">
                                        Email:
                                    </Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                    {emailError && (
                                        <p className="text-red-500 text-xs mt-1">{emailError}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="password" className="block text-sm font-medium mb-2">
                                        Password:
                                    </Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                    {passwordError && (
                                        <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading || !!usernameError || !!emailError || !!passwordError}
                                    className="w-full px-4 py-2 bg-black text-white rounded-lg shadow-md hover:bg-gray-800 active:scale-95 transition-transform duration-75"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                                            <span>Creating account...</span>
                                        </div>
                                    ) : (
                                        <ShinyText text="Sign Up!" disabled={false} speed={2} className='' />
                                    )}
                                </Button>
                                <div className="text-center text-sm">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-blue-500 underline underline-offset-4">
                                        Login
                                    </Link>
                                </div>
                            </form>
                            <div className="text-center text-xs text-muted-foreground mt-6 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                                By signing up, you agree to our <a href="#">Terms of Service</a>{" "}
                                and <a href="#">Privacy Policy</a>.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
