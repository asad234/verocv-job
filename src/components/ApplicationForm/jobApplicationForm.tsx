import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema for validation
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  employmentType: z.enum(["Privat/Egenkonsult", "Konsultbolag/Konsultformedlare"]),
  personalNumber: z.string().min(10, "Personal number is required, must be 10"),
  hasForeignPersonalNumber: z.boolean(),
  hasForeignAddress: z.boolean(),
  residence: z.string().min(1, "Residence is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  coAddress: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  linkedin: z.string().optional(),
  currentPosition: z.string().min(1, "Current position is mandatory"),
  jobCategory: z.string().min(1, "Job category is mandatory"),
  desiredEmploymentPercentage: z.enum([
    "Full_time_100",
    "Part_time_75",
    "Part_time_50",
    "Part_time_25",
    "Internship_20",
    "Freelance_Contract_variable",
  ]),
  availabilityDate: z.string().min(1, "Availability date is mandatory"),
  primaryAssignment: z.string().min(1, "Primary assignment is mandatory"),
  secondaryAssignment: z.string().optional(),
  foundAd: z.string().min(1, "Found ad is mandatory"),
  takesAssignmentAbroad: z.boolean(),
  cv: z.instanceof(File, { message: "CV is required" }),
  coverLetter: z.instanceof(File).optional(),
  message: z.string().optional(),
  consent: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

// Infer the type from the schema
type FormData = z.infer<typeof formSchema>;

// Helper function to append asterisk to required fields
const RequiredLabel = ({ label, required }: { label: string; required: boolean }) => (
  <span>
    {label}
    {required && <span className="text-red-500"> *</span>}
  </span>
);

const JobApplicationForm = ({ currJobId }: { currJobId: string }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employmentType: "Privat/Egenkonsult",
      hasForeignPersonalNumber: false,
      hasForeignAddress: false,
      takesAssignmentAbroad: false,
      consent: false,
      cv: undefined,
    },
  });

  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Append all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      formData.append("jobId", currJobId)
      // Send form data to the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/job-applications`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error("Submission failed:", result.error);
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            setError(key as keyof FormData, {
              type: "manual",
              message: result.errors[key],
            });
          });
        }
      }
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setLoading(false);
    }
  };

  // Success Banner
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-8">
        <div className="text-green-600 text-9xl mb-4">✔️</div>
        <h1 className="text-4xl font-bold text-green-700 mb-4">Application Submitted Successfully!</h1>
        <p className="text-lg text-green-600 text-center">
          Thank you for applying. We will review your application and get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsSubmitted(false);
          }}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mt-4"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  // Form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Job Application Form</h1>

      {/* Personal Information Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="First Name" required={true} />
            </label>
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="First Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Last Name" required={true} />
            </label>
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Last Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Du Ar" required={true} />
            </label>
            <Controller
              control={control}
              name="employmentType"
              render={({ field }) => (
                <select
                  {...field}
                  aria-label="Employment Type"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Privat/Egenkonsult">Privat/Egenkonsult</option>
                  <option value="Konsultbolag/Konsultförmedlare">Konsulbolag/Konsultförmedlare</option>
                </select>
              )}
            />
            {errors.employmentType && <p className="text-red-500 text-sm mt-1">{errors.employmentType.message}</p>}
          </div>

          {/* Personnummer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Personnummer" required={true} />
            </label>
            <Controller
              control={control}
              name="personalNumber"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Personal Number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.personalNumber && <p className="text-red-500 text-sm mt-1">{errors.personalNumber.message}</p>}
          </div>

          {/* Har Utländskt Personnummer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Har Utländskt Personnummer?</label>
            <Controller
              control={control}
              name="hasForeignPersonalNumber"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Har Utländsk Adress */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Har Utländsk Adress?</label>
            <Controller
              control={control}
              name="hasForeignAddress"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Bostad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Bostad" required={true} />
            </label>
            <Controller
              control={control}
              name="residence"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Residence"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.residence && <p className="text-red-500 text-sm mt-1">{errors.residence.message}</p>}
          </div>

          {/* Ort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Ort" required={true} />
            </label>
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="City"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
          </div>

          {/* Postnummer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Postnummer" required={true} />
            </label>
            <Controller
              control={control}
              name="postalCode"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Postal Code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>}
          </div>

          {/* Co Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Co Address</label>
            <Controller
              control={control}
              name="coAddress"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Co Address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Email" required={true} />
            </label>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  aria-label="Email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Telefon" required={true} />
            </label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Phone"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
            <Controller
              control={control}
              name="linkedin"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="LinkedIn"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Professional Information Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Professional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Current Position" required={true} />
            </label>
            <Controller
              control={control}
              name="currentPosition"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Current Position"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.currentPosition && <p className="text-red-500 text-sm mt-1">{errors.currentPosition.message}</p>}
          </div>

          {/* Job Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Job Category" required={true} />
            </label>
            <Controller
              control={control}
              name="jobCategory"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Job Category"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.jobCategory && <p className="text-red-500 text-sm mt-1">{errors.jobCategory.message}</p>}
          </div>

          {/* Desired Employment Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Desired Employment Percentage" required={true} />
            </label>
            <Controller
              control={control}
              name="desiredEmploymentPercentage"
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an option</option>
                  <option value="Full_time_100">Full-time (100%)</option>
                  <option value="Part_time_75">Part-time (75%)</option>
                  <option value="Part_time_50">Part-time (50%)</option>
                  <option value="Part_time_25">Part-time (25%)</option>
                  <option value="Internship_20">Internship (20%)</option>
                  <option value="Freelance_Contract_variable">
                    Freelance / Contract (variable)
                  </option>
                </select>
              )}
            />
            {errors.desiredEmploymentPercentage && (
              <p className="text-red-500 text-sm mt-1">{errors.desiredEmploymentPercentage.message}</p>
            )}
          </div>

          {/* Availability Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Availability Date" required={true} />
            </label>
            <Controller
              control={control}
              name="availabilityDate"
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  aria-label="Availability Date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.availabilityDate && <p className="text-red-500 text-sm mt-1">{errors.availabilityDate.message}</p>}
          </div>

          {/* Primary Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Primary Assignment" required={true} />
            </label>
            <Controller
              control={control}
              name="primaryAssignment"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Primary Assignment"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.primaryAssignment && <p className="text-red-500 text-sm mt-1">{errors.primaryAssignment.message}</p>}
          </div>

          {/* Secondary Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Assignment</label>
            <Controller
              control={control}
              name="secondaryAssignment"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Secondary Assignment"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Found Ad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Found Ad" required={true} />
            </label>
            <Controller
              control={control}
              name="foundAd"
              render={({ field }) => (
                <input
                  {...field}
                  aria-label="Found Ad"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.foundAd && <p className="text-red-500 text-sm mt-1">{errors.foundAd.message}</p>}
          </div>

          {/* Takes Assignment Abroad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Takes Assignment Abroad?</label>
            <Controller
              control={control}
              name="takesAssignmentAbroad"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="CV" required={true} />
            </label>
            <Controller
              control={control}
              name="cv"
              render={({ field }) => (
                <input
                  type="file"
                  onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  aria-label="CV"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
            {errors.cv && <p className="text-red-500 text-sm mt-1">{errors.cv.message}</p>}
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
            <Controller
              control={control}
              name="coverLetter"
              render={({ field }) => (
                <input
                  type="file"
                  onChange={(e) => field.onChange(e.target.files?.[0] || null)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  aria-label="Cover Letter"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <Controller
              control={control}
              name="message"
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  aria-label="Message"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            />
          </div>

          {/* Consent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <RequiredLabel label="Consent" required={true} />
            </label>
            <Controller
              control={control}
              name="consent"
              render={({ field }) => (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">I agree to the terms and conditions</span>
                </div>
              )}
            />
            {errors.consent && <p className="text-red-500 text-sm mt-1">{errors.consent.message}</p>}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8">
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </div>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
};

export default JobApplicationForm;