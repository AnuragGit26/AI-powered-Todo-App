import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { cn } from "../lib/utils";
import { Button } from "./ui/button.tsx";
import SplitText from './ui/SplitText';
import { useToast } from "../hooks/use-toast";

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
    const { toast } = useToast();

    const handlePasswordResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            console.error('Error sending password reset email:', error.message);
        } else {
            console.log('Password reset email sent');
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
                        <form onSubmit={handlePasswordResetRequest}>
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" onClick={() => {
                                    toast({
                                        title: "Email Reset Link Sent!",
                                    })
                                }}>
                                    Send Password Reset Email
                                </Button>
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