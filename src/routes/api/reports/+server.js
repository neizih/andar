// routes/api/reports/+server.js
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = 'static/uploads';
if (!existsSync(uploadsDir)) {
  await mkdir(uploadsDir, { recursive: true });
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      include: {
        media: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    return json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const dateString = formData.get('date');
    
    // Validate required fields
    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create the report first
    const report = await prisma.report.create({
      data: {
        title,
        description: description || '',
        date: dateString ? new Date(dateString) : new Date()
      }
    });
    
    // Handle file uploads
    const files = formData.getAll('files');
    const mediaRecords = [];
    
    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        // Generate unique filename
        const ext = path.extname(file.name);
        const filename = `${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadsDir, filename);
        
        // Save file to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        // Create media record
        const mediaRecord = await prisma.media.create({
          data: {
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/${filename}`,
            reportId: report.id
          }
        });
        
        mediaRecords.push(mediaRecord);
      }
    }
    
    // Return the report with media
    const reportWithMedia = await prisma.report.findUnique({
      where: { id: report.id },
      include: { media: true }
    });
    
    return json(reportWithMedia, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return json({ error: 'Failed to create report' }, { status: 500 });
  }
}