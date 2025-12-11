/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Handle CORS
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': '*',
			}
		});
	}

	const response = await resolve(event);
	
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', '*');
	
	return response;
}