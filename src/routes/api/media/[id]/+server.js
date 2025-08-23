// routes/api/media/[id]/+server.js
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params }) {
  try {
    // Get media record
    const media = await prisma.media.findUnique({
      where: { id: params.id }
    });
    
    if (!media) {
      return json({ error: 'Media not found' }, { status: 404 });
    }
    
    // Delete file from disk
    const filePath = `static${media.path}`;
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }
    }
    
    // Delete media record
    await prisma.media.delete({
      where: { id: params.id }
    });
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return json({ error: 'Failed to delete media' }, { status: 500 });
  }
}