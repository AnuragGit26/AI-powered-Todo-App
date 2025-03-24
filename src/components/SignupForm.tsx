import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import SplitText from "./ui/SplitText";
import Aurora from "./ui/AuroraBG.tsx";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function SignUpForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
                navigate("/login");
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
        <div className="overflow-hidden h-screen">
            <Aurora
                colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
                blend={0.5}
                amplitude={1.0}
                speed={0.7}
            />
            <div className="absolute inset-0 flex items-center justify-center min-h-screen z-50">
                <div className="max-w-3xl flex flex-col gap-10">
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
                                <div className="bg-red-200 text-red-800 p-3 rounded mb-4">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSignUp} className="grid gap-8">
                                <div>
                                    <Label htmlFor="username" className="block text-sm font-bold mb-2">
                                        Username:
                                    </Label>
                                    <Input
                                        type="text"
                                        id="username"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="block text-sm font-bold mb-2">
                                        Email:
                                    </Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password" className="block text-sm font-bold mb-2">
                                        Password:
                                    </Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-black text-white rounded-lg shadow-md hover:bg-gray-800 active:scale-95 transition-transform duration-75"
                                >
                                    {loading ? "Signing up..." : "Sign Up"}
                                </Button>
                            </form>
                            <div className="text-center text-sm m-6">
                                Already have an account?{" "}
                                <Link to="/login" className="underline underline-offset-4">
                                    Login
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                    <div
                        className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                        and <a href="#">Privacy Policy</a>.
                    </div>

                </div>
            </div>
        </div>
    );
}