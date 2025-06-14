import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('profileImage') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    // Validate file type (optional, but recommended)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.' }, { status: 400 });
    }

    // Validate file size (e.g., max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'File too large. Maximum size is 2MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Define the upload directory. Ensure it's within the /public folder to be publicly accessible.
    // process.cwd() gives the root of the Next.js project.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-images');
    const relativePath = `/uploads/profile-images/${uniqueFilename}`; // Path to be stored in DB and used in src
    const absolutePath = path.join(uploadDir, uniqueFilename);

    // Ensure the upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError: any) {
      // Ignore EEXIST error (directory already exists), rethrow others
      if (mkdirError.code !== 'EEXIST') {
        console.error('Failed to create upload directory:', mkdirError);
        return NextResponse.json({ message: 'Failed to create upload directory.' }, { status: 500 });
      }
    }
    
    // Write the file
    await writeFile(absolutePath, buffer);

    return NextResponse.json({ 
      message: 'Profile image uploaded successfully.', 
      imageUrl: relativePath // Return the relative path for use in <img> src
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json({ message: 'Internal server error during file upload.' }, { status: 500 });
  }
}
