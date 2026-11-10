"use client"
import { motion } from "framer-motion"
import { useAnimateInView } from "@/hooks/useAnimateInView"

export default function HowItWorksSection() {
    const { ref, isInView } = useAnimateInView()

    const steps = [
        {
            step: 1,
            title: "Create Account",
            description: "Sign up and create your profile in minutes",
        },
        {
            step: 2,
            title: "Fill Personal Data",
            description: "Tell us about your skills and experience",
        },
        {
            step: 3,
            title: "Upload Resume",
            description: "Upload your resume or build one with our tools",
        },
        {
            step: 4,
            title: "Find Jobs",
            description: "Browse personalized job recommendations",
        },
    ]

    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-50">
            <div className="container px-4 md:px-6 mx-auto">
                <motion.div
                    className="flex flex-col items-center justify-center space-y-4 text-center"
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                    }}
                    ref={ref}
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900">
                            How It Works
                        </h2>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-xl/relaxed">
                            Four simple steps to find your perfect job match
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 pt-12"
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.2,
                            },
                        },
                    }}
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="flex flex-col items-center text-center"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            <motion.div
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white mb-4"
                                whileHover={{ scale: 1.1, backgroundColor: "#2563EB" }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                {step.step}
                            </motion.div>
                            <h3 className="text-xl font-bold text-blue-900">{step.title}</h3>
                            <p className="text-gray-500 mt-2">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}