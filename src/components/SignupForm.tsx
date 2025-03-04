import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
                    data: {
                        username: username,
                    },
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

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-4">
                    Create an Account
                </h2>
                {error && (
                    <div className="bg-red-200 text-red-800 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                        <Label htmlFor="username" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Username:
                        </Label>
                        <Input
                            type="text"
                            id="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Email:
                        </Label>
                        <Input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="password" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                            Password:
                        </Label>
                        <Input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        {loading ? "Signing up..." : "Sign Up"}
                    </Button>
                </form>
                <div className="text-center mt-4">
                    <Link to="/login" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        Already have an account? Login
                    </Link>
                </div>
            </div>
        </div>
    );
}