// src/app/api/job-applications/route.ts

import { createJobApplication } from "@/app/actions/apply-job";


// Handle POST request
export async function POST(req: Request) {
  try {
    const formData = await req.formData(); // Get the form data from the request
    const result = await createJobApplication(formData);

    if (result) {
        return new Response(JSON.stringify({ success: true, message: 'Application submitted successfully!' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
          
    } else {
      return new Response(JSON.stringify({ success: false, error: result }), { status: 400 });
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
