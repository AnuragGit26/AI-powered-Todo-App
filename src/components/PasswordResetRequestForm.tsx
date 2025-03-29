import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { cn } from "../lib/utils";
import { Button } from "./ui/button.tsx";
import SplitText from './ui/SplitText';
import { useToast } from "../hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert.tsx";
import { Loader } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "./ui/card.tsx";
import { Input } from "./ui/input.tsx";
import { Label } from "./ui/label.tsx";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

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
            } else {
                setFormSuccess('Password reset email sent successfully. Please check your inbox.');
                console.log('Password reset email sent');
                toast({
                    title: "Email Reset Link Sent!",
                    description: "Please check your inbox for further instructions."
                });
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setFormError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnimationComplete = () => {
        console.log('All letters have animated!');
    };

    return (
        <div className={cn("flex items-center justify-center min-h-screen z-50", className)} {...props}>
            <div className="max-w-3xl flex flex-col gap-10">
                <Card>
                    <CardHeader className="text-center">
                        <SplitText
                            text="Reset Your Password"
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
                            Enter your email to receive a password reset link
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {formError && (
                            <Alert variant="destructive" className="mb-4 animate-in fade-in-50 slide-in-from-top-5">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{formError}</AlertDescription>
                            </Alert>
                        )}

                        {formSuccess && (
                            <Alert variant="success" className="mb-4 animate-in fade-in-50 slide-in-from-top-5">
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{formSuccess}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handlePasswordResetRequest}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        required
                                    />
                                    {emailError && (
                                        <p className="text-sm text-red-500">{emailError}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader className="h-5 w-5 mr-2 animate-spin" />
                                            <span>Sending...</span>
                                        </div>
                                    ) : (
                                        "Send Password Reset Email"
                                    )}
                                </Button>
                                <div className="text-center text-sm">
                                    <a href="/login" className="text-blue-500 hover:underline">
                                        Back to login
                                    </a>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div
                    className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                    By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                    and <a href="#">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
}