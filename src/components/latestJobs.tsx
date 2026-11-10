"use client";
import { useQuery } from "@tanstack/react-query";
import JobCard from "./jobCard";
import { SerializedEditorState, SerializedLexicalNode } from "@payloadcms/richtext-lexical/lexical";

interface Job {
    jobId: string;
    title: string;
    location: string;
    startDate: string;
    company: string;
    shortdescription: string;
    fulldescription: SerializedEditorState<SerializedLexicalNode>;
}

// Fetch function using REST (adjust the URL to your actual API endpoint)
const fetchJobs = async (): Promise<{ docs: Job[] }> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/job-ads?limit=2&sort=-createdAt`);
    if (!res.ok) {
        throw new Error("Failed to fetch jobs");
    }
    return res.json();
};

const JobCardsSection = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["jobAds"],
        queryFn: fetchJobs,
    });

    if (isLoading) {
        return (
            <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto z-0">
                <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
                    <h2 className="text-2xl font-bold md:text-4xl md:leading-tight text-blue-600 dark:text-white">
                        Explore Interim Job Opportunities
                    </h2>
                    <p className="mt-1 text-gray-600 dark:text-neutral-400">
                        Find short-term job roles that match your skills and experience in various industries.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(2)].map((_, index) => (
                        <div
                            key={index}
                            className="group flex flex-col p-4 border rounded-lg shadow-md bg-gray-200 animate-pulse"
                        >
                            <div className="relative mb-4">
                                <div className="w-24 h-4 bg-gray-300 rounded-md"></div>
                            </div>
                            <div className="w-48 h-6 bg-gray-300 rounded-md mb-2"></div>
                            <div className="mt-1">
                                <div className="w-32 h-4 bg-gray-300 rounded-md mb-2"></div>
                                <div className="w-24 h-4 bg-gray-300 rounded-md"></div>
                            </div>
                            <div className="mt-3 w-full h-4 bg-gray-300 rounded-md"></div>
                            <div className="mt-5 inline-flex items-center gap-x-1 text-sm text-blue-600 bg-gray-300 rounded-md w-32 h-4"></div>
                        </div>
                    ))}
                    <StaticThirdCard />
                </div>
            </div>
        );
    }

    if (error instanceof Error) return <p>Error: {error.message}</p>;

    return (
        <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto z-0">
            <div className="max-w-2xl mx-auto text-center mb-10 lg:mb-14">
                <h2 className="text-2xl font-bold md:text-4xl md:leading-tight text-blue-600 dark:text-white">
                    Explore Interim Job Opportunities
                </h2>
                <p className="mt-1 text-gray-600 dark:text-neutral-400">
                    Find short-term job roles that match your skills and experience in various industries.
                </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.docs?.map((job: Job) => (
                    <JobCard key={job.jobId} job={job} />
                ))}
                <StaticThirdCard />
            </div>
        </div>
    );
};

// Extracted static third card for clarity
const StaticThirdCard = () => (
    <a
        className="group relative flex flex-col w-full min-h-60 bg-cover bg-center rounded-xl hover:shadow-lg focus:outline-none focus:shadow-lg transition"
        href="#"
        style={{ backgroundColor: "blue" }}
    >
        <div className="absolute inset-0 bg-black opacity-50 rounded-xl"></div>
        <div className="flex-auto p-4 md:p-6 relative">
            <h3 className="text-sm sm:text-lg text-white/90 group-hover:text-white">
                <span className="font-bold">Looking for Your Next Career Opportunity?</span> — Explore more job listings and take the next step in your career.
            </h3>
        </div>
        <div className="pt-0 p-4 md:p-6 relative">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:text-white/70 group-focus:text-white/70">
                Get Started
                <svg
                    className="shrink-0 size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </div>
        </div>
    </a>
);

export default JobCardsSection;
