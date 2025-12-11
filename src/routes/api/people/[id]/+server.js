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
		const requestData = await request.json();
		console.log('Received update data:', requestData);
		
		// Extract all possible fields
		const { firstName, lastName, email, phone, isActive, inactiveDate } = requestData;
		
		// Build the update data object - only include fields that are provided
		const updateData = {};
		
		if (firstName !== undefined) updateData.firstName = firstName;
		if (lastName !== undefined) updateData.lastName = lastName;
		if (email !== undefined) updateData.email = email;
		if (phone !== undefined) updateData.phone = phone;
		if (isActive !== undefined) updateData.isActive = isActive;
		if (inactiveDate !== undefined) updateData.inactiveDate = inactiveDate ? new Date(inactiveDate) : null;
		
		console.log('Updating person with data:', updateData);
		
		const person = await prisma.person.update({
			where: { id: parseInt(params.id) },
			data: updateData
		});
		
		console.log('Updated person result:', person);
		return json(person);
	} catch (error) {
		console.error('Error updating person:', error);
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