"use client"
import { motion } from "framer-motion"
import { UserPlus, Filter, CheckCircle } from "lucide-react"
import { useAnimateInView } from "@/hooks/useAnimateInView"

export default function FeaturesSection() {
    const { ref, isInView } = useAnimateInView()

    const features = [
        {
            icon: <UserPlus className="h-6 w-6 text-blue-600" />,
            title: "Manage Candidates",
            description: "Track your applications and stay organized throughout your job search",
        },
        {
            icon: <Filter className="h-6 w-6 text-blue-600" />,
            title: "AI Matching",
            description: "Our AI algorithm matches you with jobs that fit your skills and experience",
        },
        {
            icon: <CheckCircle className="h-6 w-6 text-blue-600" />,
            title: "Personalized Results",
            description: "Get job recommendations tailored to your preferences and career goals",
        },
    ]

    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
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
                            Powerful features for job seekers
                        </h2>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-xl/relaxed">
                            Everything you need to find and land your dream job in one place
                        </p>
                    </div>
                </motion.div>
                <motion.div
                    className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 pt-12"
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
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ y: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <div className="rounded-lg border-2 border-blue-100 p-6 h-full hover:shadow-lg transition-shadow duration-300">
                                <div className="space-y-4">
                                    <motion.div
                                        className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-100 mb-4"
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        {feature.icon}
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-blue-900">{feature.title}</h3>
                                    <p className="text-gray-500">{feature.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}