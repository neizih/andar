<script>
	import { onMount } from 'svelte';

	let people = [];
	let showForm = false;
	let editingPerson = null;
	let form = {
		firstName: '',
		lastName: '',
		email: '',
		phone: ''
	};

	onMount(() => {
		fetchPeople();
	});

	async function fetchPeople() {
		try {
			const response = await fetch('/api/people');
			people = await response.json();
		} catch (error) {
			console.error('Failed to fetch people:', error);
		}
	}

	async function handleSubmit() {
		try {
			const url = editingPerson ? `/api/people/${editingPerson.id}` : '/api/people';
			const method = editingPerson ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});

			if (response.ok) {
				await fetchPeople();
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error);
			}
		} catch (error) {
			console.error('Failed to save person:', error);
		}
	}

	async function deletePerson(id) {
		if (confirm('Are you sure you want to delete this person?')) {
			try {
				const response = await fetch(`/api/people/${id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					await fetchPeople();
				}
			} catch (error) {
				console.error('Failed to delete person:', error);
			}
		}
	}

	function editPerson(person) {
		editingPerson = person;
		form = { ...person };
		showForm = true;
	}

	function resetForm() {
		form = {
			firstName: '',
			lastName: '',
			email: '',
			phone: ''
		};
		editingPerson = null;
		showForm = false;
	}
</script>

<main class="container">
	<h1>People Manager</h1>

	<button on:click={() => showForm = !showForm}>
		{showForm ? 'Cancel' : 'Add New Person'}
	</button>

	{#if showForm}
		<form on:submit|preventDefault={handleSubmit} class="form">
			<h2>{editingPerson ? 'Edit Person' : 'Add New Person'}</h2>
			
			<input
				type="text"
				placeholder="First Name"
				bind:value={form.firstName}
				required
			/>
			
			<input
				type="text"
				placeholder="Last Name"
				bind:value={form.lastName}
				required
			/>
			
			<input
				type="email"
				placeholder="Email"
				bind:value={form.email}
				required
			/>
			
			<input
				type="tel"
				placeholder="Phone (optional)"
				bind:value={form.phone}
			/>
			
			<div class="form-buttons">
				<button type="submit">{editingPerson ? 'Update' : 'Add'} Person</button>
				<button type="button" on:click={resetForm}>Cancel</button>
			</div>
		</form>
	{/if}

	<div class="people-list">
		{#each people as person (person.id)}
			<div class="person-card">
				<h3>{person.firstName} {person.lastName}</h3>
				<p>Email: {person.email}</p>
				{#if person.phone}
					<p>Phone: {person.phone}</p>
				{/if}
				<p class="date">Added: {new Date(person.createdAt).toLocaleDateString()}</p>
				
				<div class="actions">
					<button on:click={() => editPerson(person)}>Edit</button>
					<button on:click={() => deletePerson(person.id)} class="delete">Delete</button>
				</div>
			</div>
		{/each}
	</div>

	{#if people.length === 0}
		<p class="empty">No people added yet. Click "Add New Person" to get started!</p>
	{/if}
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
	}

	.form {
		background: #f5f5f5;
		padding: 20px;
		border-radius: 8px;
		margin: 20px 0;
	}

	.form input {
		width: 100%;
		padding: 10px;
		margin: 5px 0;
		border: 1px solid #ddd;
		border-radius: 4px;
		box-sizing: border-box;
	}

	.form-buttons {
		margin-top: 10px;
	}

	.form-buttons button {
		margin-right: 10px;
	}

	.people-list {
		margin-top: 20px;
	}

	.person-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 15px;
		margin: 10px 0;
	}

	.person-card h3 {
		margin: 0 0 10px 0;
	}

	.person-card p {
		margin: 5px 0;
	}

	.date {
		color: #666;
		font-size: 0.9em;
	}

	.actions {
		margin-top: 10px;
	}

	.actions button {
		margin-right: 10px;
		padding: 5px 10px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.actions button:first-child {
		background: #007bff;
		color: white;
	}

	.delete {
		background: #dc3545 !important;
		color: white !important;
	}

	.empty {
		text-align: center;
		color: #666;
		font-style: italic;
		margin: 40px 0;
	}
</style>