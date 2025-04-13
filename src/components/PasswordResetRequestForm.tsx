import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Mail, ArrowRight, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { cn } from "../lib/utils";
import SplitText from './ui/SplitText.tsx';
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader } from "lucide-react";

export function PasswordResetRequestForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const { toast } = useToast();

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

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) validateEmail(value);
    };

    const handlePasswordResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous messages
        setFormError('');
        setFormSuccess('');

        // Validate email
        if (!validateEmail(email)) {
            toast({
                title: "Validation Error",
                description: "Please provide a valid email address",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) {
                console.error('Error sending password reset email:', error.message);
                setFormError(error.message);
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive"
                });
            } else {
                setFormSuccess('Password reset email sent successfully. Please check your inbox.');
                console.log('Password reset email sent');
                toast({
                    title: "Success",
                    description: "Password reset link sent to your email",
                    variant: "default"
                });
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setFormError('An unexpected error occurred. Please try again later.');
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8", className)} {...props}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/30 overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
                    <CardHeader className="space-y-1 pb-6 pt-8 px-6 text-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
                        <div className="mx-auto mb-4 p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 w-16 h-16 flex items-center justify-center">
                            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <SplitText
                            text="Reset Your Password"
                            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                            delay={70}
                            animationFrom={{ opacity: 0, transform: 'translate3d(0,20px,0)' }}
                            animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                            easing="easeOutCubic"
                            threshold={0.2}
                            rootMargin="-20px"
                        />
                        <CardDescription className="text-gray-600 dark:text-gray-300 mt-2">
                            Enter your email to receive a password reset link
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {formError && (
                            <Alert variant="destructive" className="mb-4 animate-in fade-in-50 slide-in-from-top-5 border-red-200 text-red-800 dark:text-red-200 dark:border-red-800/30">
                                <AlertTitle className="flex items-center gap-2 font-semibold">
                                    <div className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400"></div>Error
                                </AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        {formSuccess && (
                            <Alert className="mb-4 animate-in fade-in-50 slide-in-from-top-5 bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800/30">
                                <AlertTitle className="flex items-center gap-2 font-semibold">
                                    <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>Success
                                </AlertTitle>
                                <AlertDescription>{formSuccess}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handlePasswordResetRequest} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 dark:text-gray-200">Email Address</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={cn(
                                            "pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg",
                                            emailError ? "border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400" : ""
                                        )}
                                        required
                                    />
                                </div>
                                {emailError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 mt-1"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                                        {emailError}
                                    </motion.p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    "Send Password Reset Link"
                                )}
                            </Button>
                            <div className="text-center">
                                <a
                                    href="/login"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back to login
                                </a>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
                            By requesting a password reset, you agree to our <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">Privacy Policy</a>.
                        </p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}