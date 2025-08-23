<!-- routes/reports/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import MediaUpload from '$lib/components/MediaUpload.svelte';
  
  let reports = [];
  let loading = false;
  let showForm = false;
  let editingReport = null;
  
  // Form data
  let formData = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    files: []
  };
  
  let submitting = false;
  
  onMount(() => {
    loadReports();
  });
  
  async function loadReports() {
    loading = true;
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        reports = await response.json();
      } else {
        console.error('Failed to load reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      loading = false;
    }
  }
  
  function openCreateForm() {
    editingReport = null;
    formData = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      files: []
    };
    showForm = true;
  }
  
  function openEditForm(report) {
    editingReport = report;
    formData = {
      title: report.title,
      description: report.description || '',
      date: new Date(report.date).toISOString().split('T')[0],
      files: []
    };
    showForm = true;
  }
  
  function closeForm() {
    showForm = false;
    editingReport = null;
    formData = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      files: []
    };
  }
  
  async function submitForm() {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    submitting = true;
    
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('date', formData.date);
      
      // Add files
      formData.files.forEach(file => {
        form.append('files', file);
      });
      
      const url = editingReport ? `/api/reports/${editingReport.id}` : '/api/reports';
      const method = editingReport ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: form
      });
      
      if (response.ok) {
        await loadReports();
        closeForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save report');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save report');
    } finally {
      submitting = false;
    }
  }
  
  async function deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  }
  
  async function deleteMedia(mediaId, reportId) {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadReports();
      } else {
        alert('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  }
  
  function handleFilesChanged(event) {
    formData.files = event.detail;
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function getMediaIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  }
</script>

<svelte:head>
  <title>Daily Reports</title>
</svelte:head>

<div class="container">
  <header class="page-header">
    <h1>Daily Reports</h1>
    <button class="btn btn-primary" on:click={openCreateForm}>
      + New Report
    </button>
  </header>
  
  {#if loading}
    <div class="loading">Loading reports...</div>
  {:else if reports.length === 0}
    <div class="empty-state">
      <h2>No reports yet</h2>
      <p>Create your first daily report to get started.</p>
      <button class="btn btn-primary" on:click={openCreateForm}>
        Create Report
      </button>
    </div>
  {:else}
    <div class="reports-grid">
      {#each reports as report}
        <div class="report-card">
          <div class="report-header">
            <h3>{report.title}</h3>
            <div class="report-date">{formatDate(report.date)}</div>
          </div>
          
          {#if report.description}
            <p class="report-description">{report.description}</p>
          {/if}
          
          {#if report.media && report.media.length > 0}
            <div class="media-grid">
              {#each report.media as media}
                <div class="media-item">
                  {#if media.mimeType.startsWith('image/')}
                    <img src={media.path} alt={media.originalName} />
                  {:else if media.mimeType.startsWith('video/')}
                    <video controls>
                      <source src={media.path} type={media.mimeType} />
                      <track kind="captions" />
                    </video>
                  {:else}
                    <div class="file-preview">
                      <span class="file-icon">{getMediaIcon(media.mimeType)}</span>
                      <div class="file-name">{media.originalName}</div>
                      <div class="file-size">{formatFileSize(media.size)}</div>
                    </div>
                  {/if}
                  <div class="media-actions">
                    <a href={media.path} target="_blank" class="btn btn-sm">View</a>
                    <button 
                      class="btn btn-sm btn-danger" 
                      on:click={() => deleteMedia(media.id, report.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
          
          <div class="report-actions">
            <button class="btn btn-secondary" on:click={() => openEditForm(report)}>
              Edit
            </button>
            <button class="btn btn-danger" on:click={() => deleteReport(report.id)}>
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Form Modal -->
{#if showForm}
  <div class="modal-overlay" on:click={closeForm} role="presentation">
    <div class="modal" on:click|stopPropagation role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>{editingReport ? 'Edit Report' : 'Create New Report'}</h2>
        <button class="close-btn" on:click={closeForm}>✕</button>
      </div>
      
      <form on:submit|preventDefault={submitForm} class="modal-body">
        <div class="form-group">
          <label for="title">Title *</label>
          <input 
            id="title"
            type="text" 
            bind:value={formData.title} 
            required 
            placeholder="Enter report title"
          />
        </div>
        
        <div class="form-group">
          <label for="date">Date</label>
          <input 
            id="date"
            type="date" 
            bind:value={formData.date}
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description"
            bind:value={formData.description} 
            placeholder="Enter report description"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Media Files</label>
          <MediaUpload 
            bind:files={formData.files} 
            on:filesChanged={handleFilesChanged}
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={closeForm}>
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            disabled={submitting || !formData.title.trim()}
          >
            {submitting ? 'Saving...' : (editingReport ? 'Update Report' : 'Create Report')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 1rem;
  }
  
  .page-header h1 {
    margin: 0;
    color: #1f2937;
    font-size: 2.5rem;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
    font-size: 1.1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #6b7280;
  }
  
  .empty-state h2 {
    margin: 0 0 1rem 0;
    color: #374151;
  }
  
  .empty-state p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
  }
  
  .reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }
  
  .report-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }
  
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .report-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.25rem;
    flex: 1;
  }
  
  .report-date {
    background: #f3f4f6;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #6b7280;
    margin-left: 1rem;
  }
  
  .report-description {
    margin: 0 0 1rem 0;
    color: #4b5563;
    line-height: 1.5;
  }
  
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
    margin: 1rem 0;
  }
  
  .media-item {
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }
  
  .media-item img,
  .media-item video {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
  }
  
  .file-preview {
    height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    text-align: center;
  }
  
  .file-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .file-name {
    font-size: 0.75rem;
    color: #374151;
    font-weight: 500;
    margin-bottom: 0.25rem;
    word-break: break-word;
  }
  
  .file-size {
    font-size: 0.625rem;
    color: #6b7280;
  }
  
  .media-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .media-item:hover .media-actions {
    opacity: 1;
  }
  
  .report-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #1f2937;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.25rem;
  }
  
  .close-btn:hover {
    color: #374151;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #374151;
    font-weight: 500;
  }
  
  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  /* Button Styles */
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .page-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .reports-grid {
      grid-template-columns: 1fr;
    }
    
    .report-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .report-date {
      margin-left: 0;
      align-self: flex-start;
    }
    
    .media-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    
    .modal {
      margin: 1rem;
    }
  }
</style>