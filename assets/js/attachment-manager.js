class AttachmentManager {
    constructor(app) {
        this.app = app;
        this.attachments = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.allowedFileTypes = [
            'text/plain', 'text/csv', 'application/json', 'application/xml',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createFileInputs();
    }
    
    createFileInputs() {
        // Create hidden file inputs
        this.imageInput = document.createElement('input');
        this.imageInput.type = 'file';
        this.imageInput.accept = 'image/*';
        this.imageInput.multiple = true;
        this.imageInput.className = 'file-input-hidden';
        this.imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        document.body.appendChild(this.imageInput);
        
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.multiple = true;
        this.fileInput.className = 'file-input-hidden';
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.body.appendChild(this.fileInput);
    }
    
    setupEventListeners() {
        // Attach image button
        const attachImageBtn = document.getElementById('attach-image');
        if (attachImageBtn) {
            attachImageBtn.addEventListener('click', () => this.openImageSelector());
        }
        
        // Attach file button
        const attachFileBtn = document.getElementById('attach-file');
        if (attachFileBtn) {
            attachFileBtn.addEventListener('click', () => this.openFileSelector());
        }
        
        // Add link button
        const addLinkBtn = document.getElementById('add-link');
        if (addLinkBtn) {
            addLinkBtn.addEventListener('click', () => this.addLink());
        }
        
        // Clear attachments button
        const clearAttachmentsBtn = document.getElementById('clear-attachments');
        if (clearAttachmentsBtn) {
            clearAttachmentsBtn.addEventListener('click', () => this.clearAllAttachments());
        }
        
        // Drag and drop
        const inputWrapper = document.querySelector('.input-wrapper');
        if (inputWrapper) {
            inputWrapper.addEventListener('dragover', (e) => this.handleDragOver(e));
            inputWrapper.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            inputWrapper.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }
    
    openImageSelector() {
        this.imageInput.click();
    }
    
    openFileSelector() {
        this.fileInput.click();
    }
    
    handleImageSelect(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.addImageAttachment(file));
        event.target.value = ''; // Reset input
    }
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.addFileAttachment(file));
        event.target.value = ''; // Reset input
    }
    
    async addImageAttachment(file) {
        if (!this.validateImage(file)) return;
        
        try {
            const base64 = await this.fileToBase64(file);
            const attachment = {
                id: this.generateId(),
                type: 'image',
                name: file.name,
                size: file.size,
                mimeType: file.type,
                data: base64,
                preview: base64
            };
            
            this.attachments.push(attachment);
            this.updateAttachmentsDisplay();
            this.updateStats();
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.app.showNotification('Error al procesar la imagen', 'error');
        }
    }
    
    async addFileAttachment(file) {
        if (!this.validateFile(file)) return;
        
        try {
            const content = await this.readFileContent(file);
            const attachment = {
                id: this.generateId(),
                type: 'file',
                name: file.name,
                size: file.size,
                mimeType: file.type,
                data: content
            };
            
            this.attachments.push(attachment);
            this.updateAttachmentsDisplay();
            this.updateStats();
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.app.showNotification('Error al procesar el archivo', 'error');
        }
    }
    
    addLink() {
        const url = prompt('Introduce la URL del enlace:');
        if (!url) return;
        
        if (!this.isValidUrl(url)) {
            this.app.showNotification('URL no válida', 'error');
            return;
        }
        
        const attachment = {
            id: this.generateId(),
            type: 'link',
            name: this.extractDomainFromUrl(url),
            url: url,
            title: url
        };
        
        this.attachments.push(attachment);
        this.updateAttachmentsDisplay();
        this.updateStats();
        
        // Try to fetch link metadata
        this.fetchLinkMetadata(attachment);
    }
    
    async fetchLinkMetadata(attachment) {
        try {
            // This would require a CORS proxy or backend service
            // For now, just use the URL as title
            attachment.title = attachment.url;
            this.updateAttachmentsDisplay();
        } catch (error) {
            console.error('Error fetching link metadata:', error);
        }
    }
    
    validateImage(file) {
        if (!this.allowedImageTypes.includes(file.type)) {
            this.app.showNotification('Tipo de imagen no soportado', 'error');
            return false;
        }
        
        if (file.size > this.maxFileSize) {
            this.app.showNotification('La imagen es demasiado grande (máx. 50MB)', 'error');
            return false;
        }
        
        return true;
    }
    
    validateFile(file) {
        if (file.size > this.maxFileSize) {
            this.app.showNotification('El archivo es demasiado grande (máx. 50MB)', 'error');
            return false;
        }
        
        return true;
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            
            if (file.type.startsWith('text/') || file.type === 'application/json') {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }
    
    updateAttachmentsDisplay() {
        const attachmentsArea = document.getElementById('attachments-area');
        const attachmentsList = document.getElementById('attachments-list');
        
        if (!attachmentsArea || !attachmentsList) return;
        
        if (this.attachments.length === 0) {
            attachmentsArea.style.display = 'none';
            return;
        }
        
        attachmentsArea.style.display = 'block';
        attachmentsList.innerHTML = '';
        
        this.attachments.forEach(attachment => {
            const item = this.createAttachmentElement(attachment);
            attachmentsList.appendChild(item);
        });
    }
    
    createAttachmentElement(attachment) {
        const item = document.createElement('div');
        item.className = `attachment-item ${attachment.type}`;
        
        let content = '';
        
        switch (attachment.type) {
            case 'image':
                content = `
                    <img src="${attachment.preview}" alt="${attachment.name}" class="attachment-preview">
                    <div class="attachment-info">
                        <div class="attachment-name">${attachment.name}</div>
                        <div class="attachment-size">${this.formatFileSize(attachment.size)}</div>
                    </div>
                `;
                break;
                
            case 'file':
                content = `
                    <i class="fas fa-file attachment-icon"></i>
                    <div class="attachment-info">
                        <div class="attachment-name">${attachment.name}</div>
                        <div class="attachment-size">${this.formatFileSize(attachment.size)}</div>
                    </div>
                `;
                break;
                
            case 'link':
                content = `
                    <i class="fas fa-link attachment-icon"></i>
                    <div class="link-preview">
                        <div class="link-title">${attachment.title}</div>
                        <a href="${attachment.url}" target="_blank" class="link-url">${attachment.url}</a>
                    </div>
                `;
                break;
        }
        
        item.innerHTML = content + `
            <button class="attachment-remove" onclick="app.attachmentManager.removeAttachment('${attachment.id}')" title="Eliminar">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return item;
    }
    
    removeAttachment(id) {
        this.attachments = this.attachments.filter(att => att.id !== id);
        this.updateAttachmentsDisplay();
        this.updateStats();
    }
    
    clearAllAttachments() {
        this.attachments = [];
        this.updateAttachmentsDisplay();
        this.updateStats();
    }
    
    updateStats() {
        const attachmentCount = document.getElementById('attachment-count');
        if (attachmentCount) {
            attachmentCount.textContent = this.attachments.length;
        }
    }
    
    getAttachmentsForMessage() {
        return this.attachments.map(att => ({
            type: att.type,
            name: att.name,
            data: att.data,
            url: att.url,
            mimeType: att.mimeType
        }));
    }
    
    // Drag and Drop handlers
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.addImageAttachment(file);
            } else {
                this.addFileAttachment(file);
            }
        });
    }
    
    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    extractDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch (_) {
            return url;
        }
    }
}
