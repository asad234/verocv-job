"use client"; // Error boundaries must be Client Components

import posthog from "posthog-js";
import { useEffect } from "react";
import Link from "next/link"; // Import Link

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to PostHog
        posthog.captureException(error);

        // Optional: Log to console for development
        console.error("Error boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-gray-600 mb-6">
                        We apologize for the inconvenience. Our team has been notified and
                        is working on fixing the issue.
                    </p>
                    {error.digest && (
                        <p className="text-sm text-gray-500 mb-4">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        If the problem persists, please{" "}
                        <Link
                            href="/contact"
                            className="text-blue-600 hover:text-blue-800 underline"
                        >
                            contact support
                        </Link>
                    </p>
                    <div className="mt-4">
                        <Link
                            href="/"
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            ← Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}