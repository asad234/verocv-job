// utils/uploadFile.ts

export async function uploadFile(file: File | null) {
  if (!file) {
    console.error("No file provided for upload");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media`, {
      method: 'POST',
      body: formData,
    });

    if (!mediaResponse.ok) {
      throw new Error(`Media upload failed with status: ${mediaResponse.status}`);
    }

    const responseText = await mediaResponse.text();
    console.log('Raw response body:', responseText);

    if (!responseText) {
      throw new Error('Received an empty response from the server');
    }

    const mediaData = JSON.parse(responseText);
    console.log('Media upload successful:', mediaData);

    // Return the file ID if the server response contains it
    return mediaData?.doc?.id || null;

  } catch (err) {
    console.error('Error uploading file:', err);
    throw new Error('File upload failed. Please try again later.');
  }
}
