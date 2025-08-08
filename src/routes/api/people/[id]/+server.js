import prisma from '$lib/prisma.js';
import { json } from '@sveltejs/kit';

// GET - Fetch a single person
export async function GET({ params }) {
	try {
		const person = await prisma.person.findUnique({
			where: { id: parseInt(params.id) }
		});
		
		if (!person) {
			return json({ error: 'Person not found' }, { status: 404 });
		}
		
		return json(person);
	} catch (error) {
		return json({ error: 'Failed to fetch person' }, { status: 500 });
	}
}

// PUT - Update a person
export async function PUT({ params, request }) {
	try {
		const { firstName, lastName, email, phone } = await request.json();
		
		const person = await prisma.person.update({
			where: { id: parseInt(params.id) },
			data: {
				firstName,
				lastName,
				email,
				phone
			}
		});
		
		return json(person);
	} catch (error) {
		if (error.code === 'P2025') {
			return json({ error: 'Person not found' }, { status: 404 });
		}
		if (error.code === 'P2002') {
			return json({ error: 'Email already exists' }, { status: 400 });
		}
		return json({ error: 'Failed to update person' }, { status: 500 });
	}
}

// DELETE - Delete a person
export async function DELETE({ params }) {
	try {
		await prisma.person.delete({
			where: { id: parseInt(params.id) }
		});
		
		return json({ message: 'Person deleted successfully' });
	} catch (error) {
		if (error.code === 'P2025') {
			return json({ error: 'Person not found' }, { status: 404 });
		}
		return json({ error: 'Failed to delete person' }, { status: 500 });
	}
}