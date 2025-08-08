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
		return json({ error: 'Failed to fetch people' }, { status: 500 });
	}
}

// POST - Create a new person
export async function POST({ request }) {
	try {
		const { firstName, lastName, email, phone } = await request.json();
		
		const person = await prisma.person.create({
			data: {
				firstName,
				lastName,
				email,
				phone
			}
		});
		
		return json(person, { status: 201 });
	} catch (error) {
		if (error.code === 'P2002') {
			return json({ error: 'Email already exists' }, { status: 400 });
		}
		return json({ error: 'Failed to create person' }, { status: 500 });
	}
}