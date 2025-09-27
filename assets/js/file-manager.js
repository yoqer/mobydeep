class FileManager {
    constructor(app) {
        this.app = app;
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.multiple = true;
        this.fileInput.style.display = "none";
        document.body.appendChild(this.fileInput);

        this.fileInput.addEventListener("change", this.handleFileSelection.bind(this));
    }

    openFileSelector() {
        this.fileInput.click();
    }

    async handleFileSelection(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        this.app.showNotification(`Procesando ${files.length} archivo(s)...`, "info");

        for (const file of files) {
            await this.processFile(file);
        }
        this.fileInput.value = ""; // Clear input for next selection
    }

    async processFile(file) {
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.onload = async (e) => {
                const content = e.target.result;
                const fileData = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: content,
                    timestamp: Date.now()
                };

                // Here you would typically save the file data to IndexedDB or process it
                // For this static app, we'll just log it and potentially use it in the chat input
                console.log("File processed:", fileData);
                this.app.showNotification(`Archivo '${file.name}' procesado.`, "success");

                // Example: append text content to message input
                if (file.type.startsWith("text/") || file.type === "application/json") {
                    const currentInput = this.app.elements.messageInput.value;
                    this.app.elements.messageInput.value = currentInput ? `${currentInput}\n\n--- ${file.name} ---\n${content}` : content;
                    this.app.updateInputStats();
                } else if (file.type.startsWith("image/")) {
                    // For images, you might want to display a preview or send a description
                    this.app.showNotification(`Imagen '${file.name}' cargada. No se puede adjuntar directamente al chat.`, "warning");
                }
                resolve();
            };

            reader.onerror = (e) => {
                console.error("Error reading file:", e);
                this.app.showNotification(`Error al leer el archivo '${file.name}'.`, "error");
                resolve();
            };

            reader.readAsText(file); // Or readAsDataURL for images
        });
    }

    // Drag and Drop functionality (to be integrated into app.js event listeners)
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        this.app.elements.messageInput.classList.add("drag-over");
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        this.app.elements.messageInput.classList.remove("drag-over");
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.app.elements.messageInput.classList.remove("drag-over");

        const files = event.dataTransfer.files;
        if (files.length === 0) return;

        this.app.showNotification(`Procesando ${files.length} archivo(s) arrastrados...`, "info");

        for (const file of files) {
            this.processFile(file);
        }
    }
}

const fileManager = new FileManager(app); // Assuming 'app' is globally available or passed


