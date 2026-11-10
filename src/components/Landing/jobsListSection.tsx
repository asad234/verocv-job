"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useInView } from "react-intersection-observer";

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemFadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface Job {
    jobId: string;
    title: string;
    location: string;
    startDate: string;
    company: string;
    shortdescription: string;
    createdAt: string;
}

const fetchJobs = async (): Promise<Job[]> => {
    const res = await fetch("/api/job-ads?limit=3&sort=-createdAt");
    const data = await res.json();
    return data?.docs || [];
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sv-SE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).replace(/\//g, "-");
};

const JobCardsSection = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    });

    const { data: jobs, isLoading, isError, error } = useQuery<Job[]>({
        queryKey: ["job-ads"],
        queryFn: fetchJobs
    });

    if (isLoading) {
        return (
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900">
                                Featured Job Listings
                            </h2>
                            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-xl/relaxed">
                                Explore some of our top opportunities
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-12">
                        {[...Array(3)].map((_, index) => (
                            <div key={index} className="rounded-lg border-2 border-blue-100 overflow-hidden h-full">
                                <div className="p-6 pb-2 animate-pulse">
                                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="px-6 pb-2">
                                    <div className="flex items-center gap-2 text-sm mb-3">
                                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-12 w-full bg-gray-200 rounded mb-2"></div>
                                </div>
                                <div className="px-6 py-4 border-t border-blue-100 mt-2">
                                    <div className="h-10 w-full bg-gray-200 rounded-md"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <p className="text-center py-12 text-red-500">
                Error: {(error as Error).message}
            </p>
        );
    }

    return (
        <section className="w-full py-12 md:py-24 lg:py-32" ref={ref}>
            <div className="container px-4 md:px-6 mx-auto">
                <motion.div
                    className="flex flex-col items-center justify-center space-y-4 text-center"
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    variants={fadeIn}
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-900">
                            Featured Job Listings
                        </h2>
                        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-xl/relaxed">
                            Explore some of our top opportunities
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-12"
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    variants={staggerContainer}
                >
                    {jobs!.map((job) => (
                        <motion.div
                            key={job.jobId}
                            variants={itemFadeIn}
                            whileHover={{ y: -5 }}
                            className="flex flex-col"
                        >
                            <div className="rounded-lg border-2 border-blue-100 overflow-hidden h-full hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                <div className="p-6 pb-2">
                                    <h3 className="text-xl font-bold text-blue-900 line-clamp-2">
                                        {job.title}
                                    </h3>
                                    {job.company && (
                                        <p className="text-gray-500 mt-1 line-clamp-1">{job.company}</p>
                                    )}
                                </div>
                                <div className="px-6 pb-2 flex-grow">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
                                        {job.location && (
                                            <>
                                                <span className="line-clamp-1">{job.location}</span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>{formatDate(job.createdAt)}</span>
                                    </div>
                                    {job.shortdescription && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                            {job.shortdescription}
                                        </p>
                                    )}
                                </div>
                                <div className="px-6 py-4 border-t border-blue-100 mt-auto">
                                    <a
                                        href={`/jobs/${job.jobId}`}
                                        className="flex items-center justify-center w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors group"
                                    >
                                        <span>View Job</span>
                                        <motion.span className="inline-block ml-2" initial={{ x: 0 }} whileHover={{ x: 5 }}>
                                            <ArrowRight className="h-4 w-4" />
                                        </motion.span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default JobCardsSection;
