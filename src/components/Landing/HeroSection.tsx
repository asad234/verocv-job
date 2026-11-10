"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { useAnimateInView } from "@/hooks/useAnimateInView"
import { ArrowRight, UserPlus } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
    const { ref, isInView } = useAnimateInView()

    return (
        <section className="relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh] flex items-center overflow-hidden">
            {/* Background Image with Lazy Loading */}
            <div className="absolute inset-0 w-full h-full z-0">
                <Image
                    src="/images/heroBackground_new.webp"
                    alt="Professional networking at a modern office"
                    fill
                    priority
                    className="object-cover brightness-50 filter grayscale"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    quality={80}
                    placeholder="blur"
                    blurDataURL="/images/heroBackground_blured.webp"
                />
            </div>

            {/* Content Overlay */}
            <div className="container relative z-10 px-4 md:px-6 mx-auto">
                <motion.div
                    className="max-w-xl space-y-6 text-white"
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                    }}
                    ref={ref}
                >
                    <motion.p
                        className="text-blue-400 font-medium tracking-wider uppercase text-sm"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                        }}
                    >
                        Interim Job Portal
                    </motion.p>

                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter leading-tight"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                        }}
                    >
                        Find Your Next <span className="text-blue-400">Career</span> Opportunity
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-gray-200 max-w-lg leading-relaxed"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                        }}
                    >
                        Connecting top talent with leading companies. Discover flexible interim positions that match your skills and career goals.
                    </motion.p>

                    {/* Enhanced CTAs */}
                    <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full">
                        {/* Primary CTA */}
                        <motion.div
                            className="flex-1 w-full min-w-[160px]"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Link
                                href="/jobs"
                                className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 h-14 sm:h-[56px] w-full text-center"
                            >
                                <span className="truncate">Browse Jobs</span>
                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            </Link>
                        </motion.div>

                        {/* Secondary CTA */}
                        <motion.div
                            className="flex-1 w-full min-w-[160px]"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Link
                                href="/employers"
                                className="flex items-center justify-center gap-2 rounded-md border-2 border-white bg-white/10 px-4 py-3 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200 h-14 sm:h-[56px] w-full text-center"
                            >
                                <span className="truncate">For Employers</span>
                                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator for better UX */}
            <motion.div
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
                animate={{
                    y: [0, 10, 0],
                    opacity: [0.6, 1, 0.6]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
                    <motion.div
                        className="w-1 h-2 bg-blue-400 rounded-full mt-2"
                        animate={{ y: [0, 4, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </motion.div>
        </section>
    )
}