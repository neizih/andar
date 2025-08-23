<script>
	import { onMount } from 'svelte';
	
	let inventory = [];
	let showForm = false;
	let editingItem = null;
	let loading = false;
	let form = {
		name: '', 
		quantity: 0
	};

	onMount(() => {
		fetchInventory();
	});
	
	async function fetchInventory() {
		loading = true;
		try {
			const response = await fetch('/api/inventory');
			if (response.ok) {
				inventory = await response.json();
			} else {
				console.error('Failed to fetch inventory');
			}
		} catch (error) {
			console.error('Error fetching inventory:', error);
		} finally {
			loading = false;
		}
	}
	
	async function handleSubmit() {
		if (!form.name.trim()) {
			alert('Please enter a name');
			return;
		}
		
		if (form.quantity < 0) {
			alert('Quantity must be 0 or greater');
			return;
		}
		
		loading = true;
		try {
			const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
			const method = editingItem ? 'PUT' : 'POST';
			
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(form)
			});
			
			if (response.ok) {
				await fetchInventory();
				resetForm();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to save item');
			}
		} catch (error) {
			console.error('Error saving item:', error);
			alert('Failed to save item');
		} finally {
			loading = false;
		}
	}

	async function deleteItem(id) {
		if (!confirm('Are you sure you want to delete this item?')) {
			return;
		}
		
		loading = true;
		try {
			const response = await fetch(`/api/inventory/${id}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await fetchInventory();
			} else {
				const error = await response.json();
				alert(error.error || 'Failed to delete item');
			}
		} catch (error) {
			console.error('Error deleting item:', error);
			alert('Failed to delete item');
		} finally {
			loading = false;
		}
	}
	
	function editItem(item) {
		editingItem = item;
		form = { ...item };
		showForm = true;
	}

	function resetForm() {
		form = {
			name: '', 
			quantity: 0
		};
		editingItem = null;
		showForm = false;
	}
</script>

<svelte:head>
	<title>Inventory Manager</title>
</svelte:head>

<main class="container">
	<h1>Inventory Manager</h1>
	
	<button 
		on:click={() => showForm = !showForm}
		disabled={loading}
		class="toggle-btn"
	>
		{showForm ? 'Cancel' : 'Add New Item'}
	</button>
	
	{#if showForm}
		<form on:submit|preventDefault={handleSubmit} class="form">
			<h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
			
			<input
				type="text"
				placeholder="Item Name"
				bind:value={form.name}
				disabled={loading}
				required
			/>
			
			<input
				type="number"
				placeholder="Quantity"
				min="0"
				bind:value={form.quantity}
				disabled={loading}
				required
			/>
			
			<div class="form-buttons">
				<button type="submit" disabled={loading}>
					{loading ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
				</button>
				<button type="button" on:click={resetForm} disabled={loading}>Cancel</button>
			</div>
		</form>
	{/if}
	
	{#if loading}
		<div class="loading">Loading...</div>
	{/if}
	
	<div class="inventory-list">
		{#each inventory as item (item.id)}
			<div class="item-card">
				<h3>{item.name}</h3>
				<p>Quantity: <span class="quantity">{item.quantity}</span></p>
				<p class="date">Added: {new Date(item.createdAt).toLocaleDateString()}</p>
				
				<div class="actions">
					<button on:click={() => editItem(item)} disabled={loading}>Edit</button>
					<button on:click={() => deleteItem(item.id)} class="delete" disabled={loading}>
						Delete
					</button>
				</div>
			</div>
		{/each}
	</div>
	
	{#if inventory.length === 0 && !loading}
		<p class="empty">No items in inventory. Click "Add New Item" to get started!</p>
	{/if}
</main>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: system-ui, sans-serif;
	}

	h1 {
		color: #333;
		margin-bottom: 30px;
	}

	.toggle-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		margin-bottom: 20px;
		transition: background-color 0.2s;
	}

	.toggle-btn:hover:not(:disabled) {
		background: #0056b3;
	}

	.toggle-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form {
		background: #f8f9fa;
		padding: 24px;
		border-radius: 8px;
		margin: 20px 0;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.form h2 {
		margin-top: 0;
		margin-bottom: 20px;
		color: #333;
	}

	.form input {
		width: 100%;
		padding: 12px;
		margin: 8px 0;
		border: 2px solid #ddd;
		border-radius: 6px;
		box-sizing: border-box;
		font-size: 16px;
	}

	.form input:focus {
		outline: none;
		border-color: #007bff;
	}

	.form input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.form-buttons {
		margin-top: 20px;
	}

	.form-buttons button {
		margin-right: 10px;
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.2s;
	}

	.form-buttons button[type="submit"] {
		background: #28a745;
		color: white;
	}

	.form-buttons button[type="submit"]:hover:not(:disabled) {
		background: #218838;
	}

	.form-buttons button[type="button"] {
		background: #6c757d;
		color: white;
	}

	.form-buttons button[type="button"]:hover:not(:disabled) {
		background: #5a6268;
	}

	.form-buttons button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 20px;
		color: #666;
		font-style: italic;
	}

	.inventory-list {
		margin-top: 30px;
	}

	.item-card {
		background: white;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		padding: 20px;
		margin: 15px 0;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		transition: box-shadow 0.2s;
	}

	.item-card:hover {
		box-shadow: 0 4px 8px rgba(0,0,0,0.15);
	}

	.item-card h3 {
		margin: 0 0 10px 0;
		color: #333;
	}

	.item-card p {
		margin: 8px 0;
		color: #666;
	}

	.quantity {
		font-weight: bold;
		color: #007bff;
	}

	.date {
		font-size: 0.9em;
		color: #999;
	}

	.actions {
		margin-top: 15px;
	}

	.actions button {
		margin-right: 10px;
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.actions button:first-child {
		background: #007bff;
		color: white;
	}

	.actions button:first-child:hover:not(:disabled) {
		background: #0056b3;
	}

	.delete {
		background: #dc3545 !important;
		color: white !important;
	}

	.delete:hover:not(:disabled) {
		background: #c82333 !important;
	}

	.actions button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.empty {
		text-align: center;
		color: #666;
		font-style: italic;
		margin: 40px 0;
		padding: 40px;
		background: #f8f9fa;
		border-radius: 8px;
	}
</style>