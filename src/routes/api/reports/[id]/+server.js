// routes/api/reports/[id]/+server.js
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const uploadsDir = 'static/uploads';

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request }) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const clientCode = formData.get('clientCode');  // NEW
    const addedBy = formData.get('addedBy');        // NEW
    const dateString = formData.get('date');

    // DEBUG: Log what we're receiving
    console.log('📝 Editing report - Received form data:', {
      title,
      description,
      clientCode,
      addedBy,
      dateString
    });

    if (!title) {
      return json({ error: 'Title is required' }, { status: 400 });
    }

    // Ensure uploads directory exists
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Update the report
    const updateData = {
      title,
      description: description || '',
      clientCode: clientCode || null,  // NEW
      addedBy: addedBy || null,        // NEW
      date: dateString ? new Date(dateString) : new Date()
    };

    console.log('💾 Updating report with data:', updateData);

    const report = await prisma.report.update({
      where: { id: params.id },
      data: updateData
    });

    console.log('✅ Report updated:', report);

    // Handle new file uploads
    const files = formData.getAll('files');

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

    // Return the updated report with media
    const reportWithMedia = await prisma.report.findUnique({
      where: { id: params.id },
      include: { media: true }
    });

    return json(reportWithMedia);
  } catch (error) {
    console.error('Error updating report:', error);
    return json({ error: 'Failed to update report' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    // Get report with media
    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: { media: true }
    });

    if (!report) {
      return json({ error: 'Report not found' }, { status: 404 });
    }

    // Delete all media files from disk
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

    // Delete report (media will be deleted via cascade)
    await prisma.report.delete({
      where: { id: params.id }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
