import React from "react";
import Link from "next/link";
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

interface JobCardProps {
    job: Job;
}

// Function to truncate the short description to a fixed length
const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

const JobCard: React.FC<JobCardProps> = ({ job }) => {
    return (
        <Link href={`/jobs/${job.jobId}`} passHref>
            <div
                className="group flex flex-col p-6 border rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
                {/* Job ID Section */}
                <div className="relative mb-4">
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-medium py-1 px-3 rounded-l-xl">
                        Job ID: {job.jobId}
                    </span>
                </div>

                {/* Job Title */}
                <h3 className="text-xl font-semibold text-blue-700 group-hover:text-blue-900">
                    {job.title}
                </h3>

                {/* Job Location and Start Date */}
                <div className="mt-1 text-gray-600">
                    <p>{job.location}</p>
                    <p className="text-sm text-gray-500">
                        {new Date(job.startDate).toLocaleDateString()}
                    </p>
                </div>

                {/* Job Short Description */}
                <p className="mt-3 text-gray-800 dark:text-neutral-200">
                    {truncateText(job.shortdescription, 120)}
                </p>

                {/* Read More Link */}
                <p className="mt-5 inline-flex items-center gap-x-1 text-sm text-blue-600 decoration-2 group-hover:underline group-focus:underline font-medium dark:text-blue-500">
                    Read more
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
                </p>
            </div>
        </Link>
    );
};

export default JobCard;
