
import Hero from "@/components/heroMain";
import LatestJobs from "@/components/latestJobs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Job portal",
  description: "Job portal for private and corporal",
};

export default function Home() {

  return (
    <main>
      <Hero></Hero>
      <LatestJobs></LatestJobs>
    </main>
  );
}
