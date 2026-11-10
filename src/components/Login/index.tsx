"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // Import signIn from next-auth

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Perform login with NextAuth
        const response = await signIn('credentials', {
            redirect: false, // Prevent automatic redirect
            email,
            password,
        });

        if (response?.error) {
            setError(response.error);
        } else {
            router.push('/dashboard'); // Redirect to dashboard on success
        }
    };

    return (
        <section className="bg-cream-light min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg dark:bg-gray-800 p-8 space-y-6">
                {/* Logo and Title */}
                <div className="text-center">
                    <Link href="/" className="flex items-center justify-center mb-6 text-2xl font-semibold text-blue-dark dark:text-white">
                        InterimJobs
                    </Link>
                    <h1 className="text-2xl font-bold leading-tight tracking-tight text-blue-dark dark:text-white">
                        Sign in to your account
                    </h1>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-blue-dark dark:text-white">
                            Your email
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="name@company.com"
                            className="w-full p-3 border border-brown-light rounded-lg focus:ring-2 focus:ring-blue-primary focus:border-blue-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-primary dark:focus:border-blue-primary"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-blue-dark dark:text-white">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="••••••••"
                            className="w-full p-3 border border-brown-light rounded-lg focus:ring-2 focus:ring-blue-primary focus:border-blue-primary dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-primary dark:focus:border-blue-primary"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {/* Remember Me and Forgot Password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="remember"
                                    aria-describedby="remember"
                                    type="checkbox"
                                    className="w-4 h-4 border border-brown-light rounded bg-cream-light focus:ring-2 focus:ring-blue-primary dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-primary"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="remember" className="text-blue-dark dark:text-gray-300">
                                    Remember me
                                </label>
                            </div>
                        </div>
                        <a href="#" className="text-sm font-medium text-blue-primary hover:underline dark:text-blue-primary">
                            Forgot password?
                        </a>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        className="w-full p-3 text-white bg-primary hover:bg-primary-dark focus:ring-4 focus:outline-none focus:ring-blue-primary font-medium rounded-lg text-sm text-center dark:bg-blue-primary dark:hover:bg-blue-dark dark:focus:ring-blue-primary transition-colors duration-200"
                    >
                        Sign in
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-sm font-light text-blue-dark dark:text-gray-400">
                        Don’t have an account yet?{' '}
                        <a href="#" className="font-medium text-blue-primary hover:underline dark:text-blue-primary">
                            Sign up
                        </a>
                    </p>
                </form>
            </div>
        </section>
    );
};

export default LoginForm;
