"use server";

import payloadConfig from "@/payload.config";
import { uploadFile } from "@/utils/fileUpload";
import { getPayload } from "payload";


export async function createJobApplication(formData: FormData) {
  console.log("🚀 Form submitted!");
  console.log(formData);

  // Extract data from FormData
  const data = {
    jobId: Number(formData.get("jobId")),
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    employmentType: formData.get("employmentType") as "Privat/Egenkonsult" | "Konsultbolag/Konsultförmedlare",
    personalNumber: formData.get("personalNumber") as string,
    hasForeignPersonalNumber: formData.get("hasForeignPersonalNumber") === "1",
    hasForeignAddress: formData.get("hasForeignAddress") === "1",
    residence: formData.get("residence") as string,
    city: formData.get("city") as string,
    postalCode: formData.get("postalCode") as string,
    coAddress: formData.get("coAddress") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    linkedin: formData.get("linkedin") as string,
    currentPosition: formData.get("currentPosition") as string,
    jobCategory: formData.get("jobCategory") as string,
    desiredEmploymentPercentage: formData.get("desiredEmploymentPercentage") as "Full_time_100"|
    "Part_time_75"|
    "Part_time_50"|
    "Part_time_25"|
    "Internship_20"|
    "Freelance_Contract_variable",
    availabilityDate: formData.get("availabilityDate") as string,
    primaryAssignment: formData.get("primaryAssignment") as string,
    secondaryAssignment: formData.get("secondaryAssignment") as string,
    foundAd: formData.get("foundAd") as string,
    takesAssignmentAbroad: formData.get("takesAssignmentAbroad") === "1",
    cv: formData.get("cv") as File,
    coverLetter: formData.get("coverLetter") as File | null, // Allow null if not provided
    message: formData.get("message") as string,
    consent: formData.get("consent") === "1",
  };

  console.log("Data being sent to Payload:", data);

  // Validate required fields
  const requiredFields = [
    "firstName", "lastName", "employmentType", "personalNumber", "residence", "city", "postalCode",
    "email", "phone", "currentPosition", "jobCategory", "desiredEmploymentPercentage", "availabilityDate",
    "primaryAssignment", "foundAd", "cv", "consent"
  ];

  const missingFields = requiredFields.filter(field => !data[field as keyof typeof data]);

  if (missingFields.length) {
    return new Response(
      JSON.stringify({ success: false, error: `Missing required fields: ${missingFields.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate desiredEmploymentPercentage enum values
  const validEmploymentPercentages = [
    "Full_time_100",
    "Part_time_75",
    "Part_time_50",
    "Part_time_25",
    "Internship_20",
    "Freelance_Contract_variable",
  ];

  if (!validEmploymentPercentages.includes(data.desiredEmploymentPercentage)) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid desired employment percentage" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await getPayload({ config: payloadConfig });

    // Upload CV
    const cvId = await uploadFile(data.cv);
    if (!cvId) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to upload CV. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Upload cover letter (if provided)
    let coverLetterId = null;
    if (data.coverLetter && data.coverLetter instanceof File) {
      coverLetterId = await uploadFile(data.coverLetter);
    }

    // Create job application
    const application = await payload.create({
      collection: "job-applications",
      data: {
        ...data,
        cv: cvId, // Attach thse uploaded mediaId for CV
        coverLetter: coverLetterId, // Attach the uploaded mediaId for Cover Letter (if provided)
      },
    });

    console.log("✅ Application created:", application);

    return new Response(
      JSON.stringify({ success: true, message: "Application submitted successfully!" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error creating job application:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to submit application. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}