import prisma from '$lib/prisma.js';
import { json } from '@sveltejs/kit';

// GET /api/inventory - Fetch all inventory items
export async function GET() {
	try {
		const inventory = await prisma.inventory.findMany({
			orderBy: { createdAt: 'desc' }
		});
		
		return json(inventory);
	} catch (error) {
		console.error('Failed to fetch inventory:', error);
		return json({ error: 'Failed to fetch inventory' }, { status: 500 });
	}
}

// POST /api/inventory - Create new inventory item
export async function POST({ request }) {
	try {
		const { name, quantity } = await request.json();
		
		// Validation
		if (!name || !name.trim()) {
			return json({ error: 'Name is required' }, { status: 400 });
		}
		
		const quantityInt = parseInt(quantity);
		if (isNaN(quantityInt) || quantityInt < 0) {
			return json({ error: 'Quantity must be a valid positive number' }, { status: 400 });
		}
		
		// Create inventory item
		const inventory = await prisma.inventory.create({
			data: {
				name: name.trim(),
				quantity: quantityInt
			}
		});
		
		return json(inventory, { status: 201 });
	} catch (error) {
		console.error('Failed to create inventory item:', error);
		return json({ error: 'Failed to create inventory item' }, { status: 500 });
	}
}