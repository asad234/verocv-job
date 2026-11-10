"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PlaceholderPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-xl w-full text-center bg-white/90 backdrop-blur-sm border border-blue-200 rounded-3xl p-12">
                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <Image
                        src="/logo/logovero.svg"
                        alt="VeroCV Logo"
                        width={300}
                        height={300}
                        className="object-contain"
                    />
                </div>

                <p className="text-lg text-slate-700 mb-8">
                    🚧 This page is currently under development. Thank you for your patience!
                </p>

                <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-300"
                >
                    Go Back Home
                </button>
            </div>

            <footer className="mt-12 text-sm text-slate-500 text-center">
                © {new Date().getFullYear()} VeroCV. All rights reserved.
            </footer>
        </div>
    );
}
