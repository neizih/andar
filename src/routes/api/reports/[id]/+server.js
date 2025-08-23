// routes/api/reports/[id]/+server.js
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  try {
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: { media: true }
    });
    
    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }
    
    return json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const dateString = formData.get('date');
    
    // Validate required fields
    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Update the report
    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        title,
        description: description || '',
        date: dateString ? new Date(dateString) : undefined
      }
    });
    
    // Handle new file uploads
    const files = formData.getAll('files');
    const uploadsDir = 'static/uploads';
    
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
        await prisma.media.create({
          data: {
            filename,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/${filename}`,
            reportId: report.id
          }
        });
      }
    }
    
    // Return updated report with media
    const updatedReport = await prisma.report.findUnique({
      where: { id: params.id },
      include: { media: true }
    });
    
    return json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    return json({ error: 'Failed to update report' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    // Get report with media to clean up files
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: { media: true }
    });
    
    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }
    
    // Delete media files from disk
    for (const media of report.media) {
      const filePath = `static${media.path}`;
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete file ${filePath}:`, error);
        }
      }
    }
    
    // Delete report (media records will be deleted due to cascade)
    await prisma.report.delete({
      where: { id: params.id }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return json({ error: 'Failed to delete report' }, { status: 500 });
  }
}