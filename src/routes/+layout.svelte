<!-- src/routes/+layout.svelte -->
<script>
  import Sidebar from '$lib/components/Sidebar.svelte';
  import '../app.css'; // Your global styles
</script>

<div class="flex min-h-screen bg-gray-50">
  <Sidebar />
  
  <!-- Main content area -->
  <div class="flex-1 lg:ml-64">
    <main class="p-4 lg:p-8 pt-16 lg:pt-8">
      <slot />
    </main>
  </div>
</div>