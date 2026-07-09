import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe, unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    // Define public directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the upload directory exists
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Write file to destination
    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, buffer);

    // Return the public web path
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Error saving file locally:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}
