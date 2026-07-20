// Cloudflare R2 Upload Script
// This script handles file selection and upload to Cloudflare R2

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const status = document.getElementById('status');
const uploadArea = document.getElementById('uploadArea');

let selectedFiles = [];

// Handle file selection
fileInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files);
    updateFileList();
});

// Drag and drop support
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
        selectedFiles = Array.from(e.dataTransfer.files);
        fileInput.files = e.dataTransfer.files;
        updateFileList();
    }
});

// Update the displayed file list
function updateFileList() {
    fileList.innerHTML = '';
    
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '<p class="no-files">No files selected</p>';
        return;
    }
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-btn" data-index="${index}">&times;</button>
        `;
        fileList.appendChild(fileItem);
    });
    
    // Add remove button handlers
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            selectedFiles.splice(index, 1);
            updateFileList();
        });
    });
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload files to Cloudflare R2
async function uploadToR2() {
    if (selectedFiles.length === 0) {
        showStatus('Please select at least one file', 'error');
        return;
    }
    
    showStatus('Preparing upload...', 'info');
    uploadBtn.disabled = true;
    
    try {
        // For each file, we need to:
        // 1. Request a pre-signed URL from your backend
        // 2. Upload the file directly to R2 using that URL
        
        const uploadPromises = selectedFiles.map(async (file) => {
            try {
                // Step 1: Get pre-signed URL from backend
                // Replace this URL with your actual backend endpoint
                const backendEndpoint = '/api/generate-presigned-url';
                
                const response = await fetch(backendEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type || 'application/octet-stream'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Backend error: ${response.statusText}`);
                }
                
                const { uploadUrl } = await response.json();
                
                // Step 2: Upload file directly to R2 using pre-signed URL
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream'
                    }
                });
                
                if (!uploadResponse.ok) {
                    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
                }
                
                return { fileName: file.name, success: true };
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                return { fileName: file.name, success: false, error: error.message };
            }
        });
        
        const results = await Promise.all(uploadPromises);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        if (failed > 0) {
            showStatus(`${successful} files uploaded, ${failed} failed. Check console for details.`, 'error');
        } else {
            showStatus(`${successful} files uploaded successfully!`, 'success');
            selectedFiles = [];
            fileInput.value = '';
            updateFileList();
        }
    } catch (error) {
        console.error('Upload error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
    }
}

// Show status message
function showStatus(message, type = 'info') {
    status.textContent = message;
    status.className = `status ${type}`;
}

// Initialize
updateFileList();
uploadBtn.addEventListener('click', uploadToR2);