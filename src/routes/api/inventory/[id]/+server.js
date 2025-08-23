import prisma from '$lib/prisma.js';
import { json } from '@sveltejs/kit';

// GET /api/inventory/[id] - Fetch single inventory item
export async function GET({ params }) {
	try {
		const id = parseInt(params.id);
		
		if (isNaN(id)) {
			return json({ error: 'Invalid ID' }, { status: 400 });
		}
		
		const inventory = await prisma.inventory.findUnique({
			where: { id }
		});
		
		if (!inventory) {
			return json({ error: 'Item not found' }, { status: 404 });
		}
		
		return json(inventory);
	} catch (error) {
		console.error('Failed to fetch inventory item:', error);
		return json({ error: 'Failed to fetch inventory item' }, { status: 500 });
	}
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT({ params, request }) {
	try {
		const id = parseInt(params.id);
		const { name, quantity } = await request.json();
		
		if (isNaN(id)) {
			return json({ error: 'Invalid ID' }, { status: 400 });
		}
		
		// Validation
		if (!name || !name.trim()) {
			return json({ error: 'Name is required' }, { status: 400 });
		}
		
		const quantityInt = parseInt(quantity);
		if (isNaN(quantityInt) || quantityInt < 0) {
			return json({ error: 'Quantity must be a valid positive number' }, { status: 400 });
		}
		
		const inventory = await prisma.inventory.update({
			where: { id },
			data: {
				name: name.trim(),
				quantity: quantityInt
			}
		});
		
		return json(inventory);
	} catch (error) {
		if (error.code === 'P2025') {
			return json({ error: 'Item not found' }, { status: 404 });
		}
		console.error('Failed to update inventory item:', error);
		return json({ error: 'Failed to update inventory item' }, { status: 500 });
	}
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE({ params }) {
	try {
		const id = parseInt(params.id);
		
		if (isNaN(id)) {
			return json({ error: 'Invalid ID' }, { status: 400 });
		}
		
		await prisma.inventory.delete({
			where: { id }
		});
		
		return json({ message: 'Item deleted successfully' });
	} catch (error) {
		if (error.code === 'P2025') {
			return json({ error: 'Item not found' }, { status: 404 });
		}
		console.error('Failed to delete inventory item:', error);
		return json({ error: 'Failed to delete inventory item' }, { status: 500 });
	}
}