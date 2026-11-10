"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import JobApplicationForm from "./ApplicationForm/jobApplicationForm";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface JobType {
  id: string;
  jobId: number;
  title: string;
  location: string;
  startDate: string;
  createdAt: string;
  company: string;
  shortdescription: any;
  fulldescription: any;
}

// Fetch job details from your REST API
const fetchJobDetail = async (id: string): Promise<JobType | null> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/job-ads?where[jobId][equals]=${id}`);
  const data = await res.json();
  return data?.docs?.[0] || null;
};

export default function JobDetails({ id }: { id: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ["jobDetail", id],
    queryFn: () => fetchJobDetail(id),
  });

  const handleApplyNowClick = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showForm]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-xl">
        Loading job details...
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500">Error: {(error as Error).message}</div>;
  }

  if (!job) {
    return <div className="text-center text-gray-500">Job not found</div>;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-6 md:py-12 bg-white">

      <div className="w-full h-72 rounded-lg shadow-lg mb-12 relative">
        <Image
          src="/images/hero.jpg"
          alt="Job Hero Image"
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          priority
          quality={75}
        />
      </div>

      <div className="grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">{job.title}</h1>
          <p className="mt-2 text-lg text-gray-600">{job.company} - {job.location}</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="text-lg font-semibold text-gray-700">
            Job ID: {job.jobId}
          </div>
          <div className="text-lg font-semibold text-gray-700">
            Posted on: {new Date(job.createdAt).toLocaleDateString()}
          </div>
          <button
            onClick={handleApplyNowClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold mt-4 hover:bg-blue-700 transition duration-300"
          >
            Apply Now
          </button>
        </div>
      </div>

      <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-white mb-4">Company Information</h3>
        <div className="space-y-4 text-white">
          <p><strong>Company:</strong> {job.company}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Start Date:</strong> {new Date(job.startDate).toLocaleDateString()}</p>
          <p><strong>Work Type:</strong> Full-time</p>
          <p><strong>Job Type:</strong> Recruitment</p>
        </div>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About the Job</h2>
          <div className="prose prose-lg text-gray-700">
            <RichText data={job.fulldescription} />
          </div>
        </div>
      </div>

      {showForm && (
        <div ref={formRef} className="mt-12">
          <JobApplicationForm currJobId={job.id} />
        </div>
      )}
    </section>
  );
}
