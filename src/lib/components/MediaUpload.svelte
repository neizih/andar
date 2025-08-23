<!-- lib/components/MediaUpload.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let files = [];
  export let maxSize = 50 * 1024 * 1024; // 50MB default
  export let acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'];
  
  const dispatch = createEventDispatcher();
  
  let dragover = false;
  let fileInput;
  
  function handleDrop(e) {
    e.preventDefault();
    dragover = false;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    dragover = true;
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dragover = false;
    }
  }
  
  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  }
  
  function addFiles(newFiles) {
    const validFiles = newFiles.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      
      // Check if file type is accepted
      const isAccepted = acceptedTypes.some(type => {
        if (type.includes('*')) {
          const [category] = type.split('/');
          return file.type.startsWith(category);
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });
      
      if (!isAccepted) {
        alert(`File type ${file.type} is not supported`);
        return false;
      }
      
      return true;
    });
    
    files = [...files, ...validFiles];
    dispatch('filesChanged', files);
  }
  
  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
    dispatch('filesChanged', files);
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function getFilePreview(file) {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }
  
  function getFileIcon(file) {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('document') || file.type.includes('word')) return '📝';
    return '📎';
  }
</script>

<div class="media-upload">
  <!-- Drop Zone -->
  <div 
    class="drop-zone" 
    class:dragover
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    role="button"
    tabindex="0"
    on:click={() => fileInput.click()}
    on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
  >
    <div class="drop-zone-content">
      <div class="upload-icon">📁</div>
      <h3>Drop files here or click to browse</h3>
      <p>Support for images, videos, audio, and documents</p>
      <p class="file-info">Maximum file size: {maxSize / 1024 / 1024}MB</p>
    </div>
  </div>
  
  <!-- Hidden File Input -->
  <input
    bind:this={fileInput}
    type="file"
    multiple
    accept={acceptedTypes.join(',')}
    on:change={handleFileSelect}
    style="display: none;"
  />
  
  <!-- File List -->
  {#if files.length > 0}
    <div class="file-list">
      <h4>Selected Files ({files.length})</h4>
      {#each files as file, index}
        <div class="file-item">
          <div class="file-preview">
            {#if getFilePreview(file)}
              <img src={getFilePreview(file)} alt={file.name} />
            {:else}
              <span class="file-icon">{getFileIcon(file)}</span>
            {/if}
          </div>
          <div class="file-info">
            <div class="file-name">{file.name}</div>
            <div class="file-size">{formatFileSize(file.size)}</div>
            <div class="file-type">{file.type || 'Unknown'}</div>
          </div>
          <button 
            type="button" 
            class="remove-btn"
            on:click={() => removeFile(index)}
            aria-label="Remove {file.name}"
          >
            ✕
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .media-upload {
    width: 100%;
  }
  
  .drop-zone {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #f8fafc;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .drop-zone:hover,
  .drop-zone.dragover {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }
  
  .drop-zone-content {
    pointer-events: none;
  }
  
  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .drop-zone h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 1.2rem;
  }
  
  .drop-zone p {
    margin: 0.25rem 0;
    color: #6b7280;
  }
  
  .file-info {
    font-size: 0.875rem;
    color: #9ca3af;
  }
  
  .file-list {
    margin-top: 1.5rem;
  }
  
  .file-list h4 {
    margin: 0 0 1rem 0;
    color: #374151;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    background-color: white;
  }
  
  .file-preview {
    width: 48px;
    height: 48px;
    margin-right: 0.75rem;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f3f4f6;
  }
  
  .file-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .file-icon {
    font-size: 1.5rem;
  }
  
  .file-info {
    flex: 1;
  }
  
  .file-name {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }
  
  .file-size {
    font-size: 0.875rem;
    color: #6b7280;
  }
  
  .file-type {
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .remove-btn {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    margin-left: 0.75rem;
  }
  
  .remove-btn:hover {
    background: #dc2626;
  }
</style>