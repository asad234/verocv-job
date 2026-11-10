
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Job portal",
    description: "Job portal for private and corporal",
};

export default function Home() {

    return (
        <main>
            <div>Page with all jobs</div>
        </main>
    );
}