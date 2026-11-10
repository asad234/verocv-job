import JobDetails from "@/components/jobDetails";
import { Metadata } from "next";
import { JSX } from "react";

type Params = Promise<{ id: string }>;

// Page metadata
export const metadata: Metadata = {
    title: "Job portal",
    description: "Job portal for private and corporate",
};

export default async function JobPage(props: { params: Params }): Promise<JSX.Element> {
    const params = await props.params;
    return <JobDetails id={params.id} />;
}
