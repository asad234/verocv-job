"use client";

import { CVBuilder } from "@/components/CV/cv-builder";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CVData, ProfileData } from "@/utils/types";

const EditCVPage = () => {
    const { id } = useParams();

    const [cvDataDigital, setCvDataDigital] = useState<CVData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCV = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/cvs/${id}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(`Failed to fetch CV (status ${res.status})`);
                }

                const data = await res.json();
                console.log("data", data);
                setCvDataDigital(data?.doc || data);
            } catch (err: any) {
                console.error("Error fetching CV:", err);
                setError("Kunde inte hämta CV. Försök igen senare.");
            } finally {
                setLoading(false);
            }
        };

        fetchCV();
    }, [id]);

    if (loading) return <p className="p-4 text-gray-500">Laddar CV...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;
    if (!cvDataDigital) return <p className="p-4 text-gray-500">Inget CV hittades.</p>;

    return <CVBuilder cvDataDigital={cvDataDigital} />;
};

export default EditCVPage;
