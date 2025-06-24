import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary_utils";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to convert a File (from FormData) to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const letterOfAuthorityFile = formData.get("letterOfAuthority") as File | null;

    if (!letterOfAuthorityFile) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    // Optional: Validate file type and size again on the server
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(letterOfAuthorityFile.type)) {
      return NextResponse.json({ message: "Invalid file type. Only PDF, DOC, DOCX, JPG, or PNG are allowed." }, { status: 400 });
    }
    if (letterOfAuthorityFile.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ message: "File size exceeds 5MB." }, { status: 400 });
    }

    const fileBuffer = await fileToBuffer(letterOfAuthorityFile);
    const userId = session.user.id;
    // Using a unique filename including user ID and timestamp to prevent overwrites and aid organization
    const fileName = `user-${userId}-loa-${Date.now()}`; 
    const folder = "letters_of_authority";

    const uploadResult = await uploadToCloudinary(fileBuffer, folder, fileName, 'auto');

    if (uploadResult && uploadResult.secure_url && uploadResult.public_id) {
      return NextResponse.json({ 
        message: "Letter of Authority uploaded successfully.",
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id 
      }, { status: 200 });
    } else {
      console.error("Cloudinary upload failed for Letter of Authority in dedicated endpoint.");
      return NextResponse.json({ message: "Failed to upload Letter of Authority." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Error uploading Letter of Authority:", error);
    return NextResponse.json({ message: `Error uploading Letter of Authority: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
