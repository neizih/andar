import prisma from '$lib/prisma.js';
import { json } from '@sveltejs/kit';

// GET - Fetch all people
export async function GET() {
	try {
		const people = await prisma.person.findMany({
			orderBy: { createdAt: 'desc' }
		});
		return json(people);
	} catch (error) {
		console.error('Error fetching people:', error);
		return json({ error: 'Failed to fetch people' }, { status: 500 });
	}
}

// POST - Create a new person
export async function POST({ request }) {
	try {
		const requestData = await request.json();
		console.log('Received create data:', requestData);
		
		// Extract all possible fields
		const { firstName, lastName, email, phone, isActive, inactiveDate } = requestData;
		
		// Build the create data object
		const createData = {
			firstName,
			lastName,
			email,
			phone: phone || null,  // Handle empty phone
			isActive: isActive !== undefined ? isActive : true,  // Default to true if not provided
			inactiveDate: inactiveDate ? new Date(inactiveDate) : null
		};
		
		console.log('Creating person with data:', createData);
		
		const person = await prisma.person.create({
			data: createData
		});
		
		console.log('Created person result:', person);
		return json(person, { status: 201 });
	} catch (error) {
		console.error('Error creating person:', error);
		if (error.code === 'P2002') {
			return json({ error: 'Email already exists' }, { status: 400 });
		}
		return json({ error: 'Failed to create person' }, { status: 500 });
	}
}