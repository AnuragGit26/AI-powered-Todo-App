import { cn } from "../lib/utils";
import { Button } from "./ui/button.tsx";
import SplitText from './ui/SplitText';
import {
    Card,
    CardContent,
    CardDescription,
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
import ShinyText from './ui/ShinyText.tsx';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleGithubSignIn = async () => {
        setLoading(true);
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
                const ipAddress= await getUserIP();
                await logActivity(user.id, 'User logged in');
                await updateUsageMetrics(user.id, { last_login: new Date(), total_logins_inc: 1, ip_address: ipAddress });
            }
            setSuccessMessage('Successfully signed in!');
            navigate("/");
        }
    };

    const handleAnimationComplete = () => {
        console.log('All letters have animated!');
    };

    return (
        <div className="overflow-hidden h-screen">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.7}
            />
            <div className={cn("absolute inset-0 flex items-center justify-center min-h-screen z-50", className)} {...props}>
                <div className="container max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Login form column */}
                        <div>
                            <Card>
                                <CardHeader className="text-center">
                                    <SplitText
                                        text="Hello, Welcome Back!"
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
                                        Login with your Apple or Google account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSignIn}>
                                        <div className="grid gap-6">
                                            <div className="flex flex-col gap-4">
                                                <Button variant="outline" className="w-full" onClick={handleGithubSignIn} disabled={loading}>
                                                    <svg viewBox="0 0 438.549 438.549" className="mr-2 h-4 w-4">
                                                        <path
                                                            fill="currentColor"
                                                            d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
                                                        ></path>
                                                    </svg>
                                                    Login with GitHub
                                                </Button>
                                                <Button variant="outline" className="w-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                                        <path
                                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    Login with Google
                                                </Button>
                                            </div>
                                            <div
                                                className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200 dark:after:border-neutral-800">
                                                <span
                                                    className="relative z-10 bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
                                                    Or continue with
                                                </span>
                                            </div>
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
                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <Label htmlFor="password">Password</Label>
                                                        <a
                                                            href="/password-reset-request"
                                                            className="ml-auto text-sm underline-offset-4 hover:underline"
                                                        >
                                                            Forgot your password?
                                                        </a>
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <Button type="submit" className="w-full px-4 py-2 bg-black text-white rounded-lg shadow-md hover:bg-grey-700 active:scale-95 transition-transform duration-75" disabled={loading}>
                                                    {loading ? (
                                                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                                        </svg>
                                                    ) : (
                                                        <ShinyText text="Sign In!" disabled={false} speed={2}  className=''/>
                                                    )}
                                                </Button>
                                            </div>
                                            {successMessage && (
                                                <div className="text-center text-green-500">
                                                    {successMessage}
                                                </div>
                                            )}
                                            {errorMessage && (
                                                <div className="text-center text-red-500">
                                                    {errorMessage}
                                                </div>
                                            )}
                                            <div className="text-center text-sm">
                                                Don&apos;t have an account?{" "}
                                                <a href="/signup" className="underline underline-offset-4">
                                                    Sign up
                                                </a>
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Introduction column - only displayed on medium screens and up */}
                        <div className="hidden md:block">
                            <TodoAIIntro />
                        </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground mt-6 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
                        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                        and <a href="#">Privacy Policy</a>.
                    </div>
                </div>
            </div>
        </div>
    );
}