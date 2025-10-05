class MultiLLMApp {
    constructor() {
        this.config = {
            apiBaseUrl: ".", // For static app, no PHP backend needed for LLM calls
            maxRetries: 3,
            requestTimeout: 30000,
            autoSave: true,
            autoSpeak: false,
            contextWindowSize: 8192,
            temperature: 0.7,
            maxResponseTokens: 4096,
        };
        
        this.state = {
            currentConversation: null,
            selectedModels: [],
            isLoading: false,
            apiKeys: storageManager.getApiKeys(), // Load API keys from local storage
            conversations: [],
            models: [],
            providers: [],
            customLLMs: storageManager.getCustomLLMs(),
        };
        
        this.elements = {};
        this.audioManager = new AudioManager(this);
        this.fileManager = new FileManager(this);
        this.translator = new Translator(this);
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoading();
            this.loadSettings(); // Load general settings
            this.initializeElements();
            await this.loadInitialData();
            this.setupEventListeners();
            this.initializeSpeech();
            this.hideLoading();
            
            this.showNotification("Aplicación inicializada correctamente", "success");
        } catch (error) {
            console.error("Error inicializando aplicación:", error);
            this.showNotification("Error al inicializar la aplicación: " + error.message, "error");
            this.hideLoading();
        }
    }
    
    loadSettings() {
        const savedSettings = storageManager.getSettings();
        Object.assign(this.config, savedSettings);
    }

    createNotificationContainer() {
        const container = document.createElement("div");
        container.id = "notification-container";
        container.className = "notification-container";
        document.body.appendChild(container);
        return container;
    }

    initializeElements() {
        // Elementos principales
        this.elements = {
            // Loading and notifications
            loadingScreen: document.getElementById("loading-screen"),
            notificationContainer: document.getElementById("notification-container") || this.createNotificationContainer(),
            
            // Header
            sidebarToggle: document.getElementById("sidebar-toggle"),
            primaryModelSelect: document.getElementById("primary-model-select"),
            settingsButton: document.getElementById("settings-button"),
            themeToggle: document.getElementById("theme-toggle"),
            
            // Sidebar
            sidebar: document.getElementById("sidebar"),
            newConversationBtn: document.getElementById("new-conversation"),
            searchConversations: document.getElementById("search-conversations"),
            conversationsList: document.getElementById("conversations-list"),
            activeModels: document.getElementById("active-models"),
            statsPanel: document.getElementById("stats-panel"),
            
            // Main response
            mainResponse: document.getElementById("main-response"),
            copyMainResponse: document.getElementById("copy-main-response"),
            speakMainResponse: document.getElementById("speak-main-response"),
            saveMainResponse: document.getElementById("save-main-response"),
            
            // Model windows
            modelSelect1: document.getElementById("model-select-1"),
            modelSelect2: document.getElementById("model-select-2"),
            modelSelect3: document.getElementById("model-select-3"),
            modelSelect4: document.getElementById("model-select-4"),
            modelSelect5: document.getElementById("model-select-5"),
            modelSelect6: document.getElementById("model-select-6"),
            modelResponse1: document.getElementById("model-response-1"),
            modelResponse2: document.getElementById("model-response-2"),
            modelResponse3: document.getElementById("model-response-3"),
            modelResponse4: document.getElementById("model-response-4"),
            modelResponse5: document.getElementById("model-response-5"),
            modelResponse6: document.getElementById("model-response-6"),
            modelStatus1: document.getElementById("model-status-1"),
            modelStatus2: document.getElementById("model-status-2"),
            modelStatus3: document.getElementById("model-status-3"),
            modelStatus4: document.getElementById("model-status-4"),
            modelStatus5: document.getElementById("model-status-5"),
            modelStatus6: document.getElementById("model-status-6"),
            modelTokens1: document.getElementById("model-tokens-1"),
            modelTokens2: document.getElementById("model-tokens-2"),
            modelTokens3: document.getElementById("model-tokens-3"),
            modelTokens4: document.getElementById("model-tokens-4"),
            modelTokens5: document.getElementById("model-tokens-5"),
            modelTokens6: document.getElementById("model-tokens-6"),
            modelTime1: document.getElementById("model-time-1"),
            modelTime2: document.getElementById("model-time-2"),
            modelTime3: document.getElementById("model-time-3"),
            modelTime4: document.getElementById("model-time-4"),
            modelTime5: document.getElementById("model-time-5"),
            modelTime6: document.getElementById("model-time-6"),
            
            // Input area
            messageInput: document.getElementById("message-input"),
            attachFile: document.getElementById("attach-file"),
            voiceInput: document.getElementById("voice-input"),
            sendMessage: document.getElementById("send-message"),
            charCount: document.getElementById("char-count"),
            wordCount: document.getElementById("word-count"),
            autoSpeakCheckbox: document.getElementById("auto-speak"),
            saveConversationCheckbox: document.getElementById("save-conversation"),
            
            // Modals
            settingsModal: document.getElementById("settings-modal"),
            fileModal: document.getElementById("file-modal"),
            
            // Settings elements
            providerApiKeys: document.getElementById("provider-api-keys"),
            modelApiKeys: document.getElementById("model-api-keys"),
            testAllConnections: document.getElementById("test-all-connections"),
            saveApiSettingsBtn: document.getElementById("save-api-settings"),

            // General Settings
            contextWindowSizeInput: document.getElementById("context-window-size"),
            temperatureSettingInput: document.getElementById("temperature-setting"),
            temperatureValueSpan: document.getElementById("temperature-value"),
            maxTokensSettingInput: document.getElementById("max-tokens-setting"),
            autoSaveSettingCheckbox: document.getElementById("auto-save-setting"),
            autoSpeakSettingCheckbox: document.getElementById("auto-speak-setting"),
            saveGeneralSettingsBtn: document.getElementById("save-general-settings"),

            // Custom LLM Settings
            customLLMList: document.getElementById("custom-llm-list"),
            customLLMIdInput: document.getElementById("custom-llm-id"),
            customLLMNameInput: document.getElementById("custom-llm-name"),
            customLLMProviderInput: document.getElementById("custom-llm-provider"),
            customLLMApiUrlInput: document.getElementById("custom-llm-api-url"),
            customLLMApiKeyInput: document.getElementById("custom-llm-api-key"),
            customLLMMaxTokensInput: document.getElementById("custom-llm-max-tokens"),
            customLLMContextWindowInput: document.getElementById("custom-llm-context-window"),
            customLLMCostInput: document.getElementById("custom-llm-cost"),
            customLLMCapabilitiesInput: document.getElementById("custom-llm-capabilities"),
            addCustomLLMBtn: document.getElementById("add-custom-llm"),
        };

        // Set initial values for general settings
        this.elements.contextWindowSizeInput.value = this.config.contextWindowSize;
        this.elements.temperatureSettingInput.value = this.config.temperature;
        this.elements.temperatureValueSpan.textContent = this.config.temperature;
        this.elements.maxTokensSettingInput.value = this.config.maxResponseTokens;
        this.elements.autoSaveSettingCheckbox.checked = this.config.autoSave;
        this.elements.autoSpeakSettingCheckbox.checked = this.config.autoSpeak;
        this.elements.autoSpeakCheckbox.checked = this.config.autoSpeak;
        this.elements.saveConversationCheckbox.checked = this.config.autoSave;
    }
    
    async loadInitialData() {
        this.state.providers = getAllProviders();
        this.state.models = this.state.providers.flatMap(p => p.models.map(m => ({ ...m, provider_id: p.id, provider_name: p.name })));
        
        this.populateModelSelects();
        await this.loadConversations();
        this.renderCustomLLMs(); // Render custom LLMs
    }
    
    async loadConversations() {
        this.state.conversations = await storageManager.getConversations();
        this.renderConversations();
    }
    
    populateModelSelects() {
        const selects = [
            this.elements.primaryModelSelect,
            this.elements.modelSelect1,
            this.elements.modelSelect2,
            this.elements.modelSelect3,
            this.elements.modelSelect4,
            this.elements.modelSelect5,
            this.elements.modelSelect6
        ];
        
        selects.forEach(select => {
            if (!select) return;
            
            // Limpiar opciones existentes
            select.innerHTML = `<option value="">Seleccionar modelo...</option>`;
            
            // Agrupar por proveedor
            const groupedModels = {};
            this.state.models.forEach(model => {
                if (!groupedModels[model.provider_name]) {
                    groupedModels[model.provider_name] = [];
                }
                groupedModels[model.provider_name].push(model);
            });
            
            // Agregar opciones agrupadas
            Object.keys(groupedModels).forEach(providerName => {
                const optgroup = document.createElement("optgroup");
                optgroup.label = providerName;
                
                groupedModels[providerName].forEach(model => {
                    const option = document.createElement("option");
                    option.value = model.id;
                    option.textContent = model.display_name;
                    option.dataset.provider = model.provider_id;
                    option.dataset.maxTokens = model.max_tokens;
                    option.dataset.contextWindow = model.context_window;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        });
    }
    
    renderConversations() {
        if (!this.elements.conversationsList) return;
        
        this.elements.conversationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No hay conversaciones</p>
            </div>
        `;
        
        if (this.state.conversations.length === 0) {
            return;
        }
        
        this.elements.conversationsList.innerHTML = ``;
        this.state.conversations.forEach(conversation => {
            const item = document.createElement("div");
            item.className = "conversation-item";
            item.dataset.conversationId = conversation.id;
            
            if (this.state.currentConversation && this.state.currentConversation.id === conversation.id) {
                item.classList.add("active");
            }
            
            item.innerHTML = `
                <div class="conversation-title">${conversation.title}</div>
                <div class="conversation-meta">
                    <span>${conversation.message_count} mensajes</span>
                    <span>${this.formatDate(conversation.updated_at)}</span>
                </div>
            `;
            
            item.addEventListener("click", () => this.selectConversation(conversation));
            this.elements.conversationsList.appendChild(item);
        });
    }
    
    setupEventListeners() {
        // Header controls
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener("click", () => this.toggleSidebar());
        }
        
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener("click", () => {
                this.openModal("settings-modal");
                this.loadApiKeysSettings(); // Cargar configuración de API keys al abrir
                this.renderCustomLLMs(); // Render custom LLMs
                this.loadGeneralSettingsUI(); // Load general settings UI
            });
        }
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());
        }

        // API Keys settings
        if (this.elements.saveApiSettingsBtn) {
            this.elements.saveApiSettingsBtn.addEventListener("click", () => this.saveApiKeys());
        }
        if (this.elements.testAllConnections) {
            this.elements.testAllConnections.addEventListener("click", () => this.testAllConnections());
        }

        // General Settings
        if (this.elements.saveGeneralSettingsBtn) {
            this.elements.saveGeneralSettingsBtn.addEventListener("click", () => this.saveGeneralSettings());
        }
        if (this.elements.temperatureSettingInput) {
            this.elements.temperatureSettingInput.addEventListener("input", (e) => {
                this.elements.temperatureValueSpan.textContent = e.target.value;
            });
        }

        // Custom LLM Settings
        if (this.elements.addCustomLLMBtn) {
            this.elements.addCustomLLMBtn.addEventListener("click", () => this.addCustomLLM());
        }

        // Input area
        if (this.elements.sendMessage) {
            this.elements.sendMessage.addEventListener("click", () => this.sendMessage());
        }
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener("input", () => this.updateInputStats());
            this.elements.messageInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        if (this.elements.voiceInput) {
            this.elements.voiceInput.addEventListener("click", () => this.audioManager.toggleListening());
        }
        if (this.elements.attachFile) {
            this.elements.attachFile.addEventListener("click", () => this.fileManager.openFileSelector());
        }

        // Drag and drop for file input
        const dropZone = document.body; // Or a specific element
        dropZone.addEventListener("dragover", (e) => this.fileManager.handleDragOver(e));
        dropZone.addEventListener("dragleave", (e) => this.fileManager.handleDragLeave(e));
        dropZone.addEventListener("drop", (e) => this.fileManager.handleDrop(e));

        // Theme toggle
        this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());

        // Auto-speak and save conversation checkboxes
        this.elements.autoSpeakCheckbox.addEventListener("change", (e) => this.config.autoSpeak = e.target.checked);
        this.elements.saveConversationCheckbox.addEventListener("change", (e) => this.config.autoSave = e.target.checked);

        // Model selects
        [this.elements.primaryModelSelect, this.elements.modelSelect1, this.elements.modelSelect2, this.elements.modelSelect3, this.elements.modelSelect4, this.elements.modelSelect5, this.elements.modelSelect6].forEach(select => {
            if (select) {
                select.addEventListener("change", (e) => this.handleModelSelection(e.target.id, e.target.value));
            }
        });
    }

    handleModelSelection(selectId, modelId) {
        // Logic to update selected models in state or UI
        // For now, just update the primary model if it's the primary select
        if (selectId === "primary-model-select") {
            // This might trigger a new conversation or change the default model for new messages
        }
        // Update active models in sidebar
        this.updateActiveModelsDisplay();
    }

    updateActiveModelsDisplay() {
        if (!this.elements.activeModels) return;
        this.elements.activeModels.innerHTML = ``;

        const selectedModelIds = new Set();
        [this.elements.primaryModelSelect, this.elements.modelSelect1, this.elements.modelSelect2, this.elements.modelSelect3, this.elements.modelSelect4, this.elements.modelSelect5, this.elements.modelSelect6].forEach(select => {
            if (select && select.value) {
                selectedModelIds.add(select.value);
            }
        });

        selectedModelIds.forEach(modelId => {
            const model = this.state.models.find(m => m.id === modelId);
            if (model) {
                const span = document.createElement("span");
                span.className = "active-model-tag";
                span.textContent = model.display_name;
                this.elements.activeModels.appendChild(span);
            }
        });
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) {
            this.showNotification("Por favor, escribe un mensaje.", "warning");
            return;
        }

        this.setLoading(true);

        try {
            // Get selected models for comparison
            const selectedModelsForComparison = [
                this.elements.modelSelect1.value,
                this.elements.modelSelect2.value,
                this.elements.modelSelect3.value,
                this.elements.modelSelect4.value,
                this.elements.modelSelect5.value,
                this.elements.modelSelect6.value
            ].filter(id => id);

            // Get primary model
            const primaryModelId = this.elements.primaryModelSelect.value;
            if (!primaryModelId && selectedModelsForComparison.length === 0) {
                this.showNotification("Por favor, selecciona al menos un modelo.", "warning");
                this.setLoading(false);
                return;
            }

            // Prepare messages for LLM (context handling)
            let messages = [];
            if (this.state.currentConversation && this.state.currentConversation.messages) {
                messages = [...this.state.currentConversation.messages];
            }
            messages.push({ role: "user", content: message });

            // Trim messages to fit context window (simplified for now)
            messages = this.trimMessagesToContext(messages, this.config.contextWindowSize);

            // Make requests to selected models
            const modelPromises = selectedModelsForComparison.map(async (modelId) => {
                const modelInfo = this.state.models.find(m => m.id === modelId);
                if (!modelInfo) return { success: false, error: "Modelo no encontrado" };

                const provider = this.state.providers.find(p => p.id === modelInfo.provider_id);
                if (!provider) return { success: false, error: "Proveedor no encontrado" };

                const apiKey = provider.getApiKeyForModel(modelId, this.state.apiKeys);
                if (!apiKey) return { success: false, error: "Clave API no configurada" };

                const client = new LLMClient(provider, modelInfo, apiKey);
                try {
                    const startTime = Date.now();
                    const response = await client.generateCompletion(messages, { 
                        max_tokens: this.config.maxResponseTokens, 
                        temperature: this.config.temperature 
                    });
                    const endTime = Date.now();
                    return { 
                        success: true, 
                        model_id: modelId, 
                        content: response.content, 
                        tokens_used: this.estimateTokens(messages.concat([{ role: "assistant", content: response.content }])),
                        response_time: endTime - startTime
                    };
                } catch (error) {
                    return { success: false, model_id: modelId, error: error.message };
                }
            });

            const modelResponses = await Promise.all(modelPromises);

            // Process responses
            this.processResponses(message, modelResponses, primaryModelId);

            // Clear input
            this.elements.messageInput.value = "";
            this.updateInputStats();

        } catch (error) {
            console.error("Error enviando mensaje:", error);
            this.showNotification("Error al enviar mensaje: " + error.message, "error");
        } finally {
            this.setLoading(false);
        }
    }

    processResponses(userMessage, modelResponses, primaryModelId) {
        // Update main response
        const primaryResponse = modelResponses.find(r => r.model_id === primaryModelId && r.success);
        if (primaryResponse) {
            this.elements.mainResponse.innerHTML = this.formatResponse(primaryResponse.content);
        } else if (modelResponses.length > 0 && modelResponses[0].success) {
            // Fallback to first successful response if no primary model selected or failed
            this.elements.mainResponse.innerHTML = this.formatResponse(modelResponses[0].content);
        } else {
            this.elements.mainResponse.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No se pudo obtener una respuesta. Verifica tus claves API y la conexión.</p>
                </div>
            `;
        }

        // Update individual model response windows
        modelResponses.forEach((response, index) => {
            const windowIndex = index + 1;
            const responseElement = this.elements[`modelResponse${windowIndex}`];
            const statusElement = this.elements[`modelStatus${windowIndex}`];
            const tokensElement = this.elements[`modelTokens${windowIndex}`];
            const timeElement = this.elements[`modelTime${windowIndex}`];
            const modelSelectElement = this.elements[`modelSelect${windowIndex}`];

            if (responseElement && modelSelectElement.value === response.model_id) {
                if (response.success) {
                    responseElement.innerHTML = this.formatResponse(response.content);
                    statusElement.textContent = "Activo";
                    statusElement.className = "model-status active";
                    tokensElement.textContent = `${response.tokens_used || 0} tokens`;
                    timeElement.textContent = `${response.response_time || 0}ms`;
                } else {
                    responseElement.innerHTML = `
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Error: ${response.error}</p>
                        </div>
                    `;
                    statusElement.textContent = "Error";
                    statusElement.className = "model-status error";
                    tokensElement.textContent = "0 tokens";
                    timeElement.textContent = `${response.response_time || 0}ms`;
                }
            }
        });

        // Save conversation if enabled
        if (this.config.autoSave) {
            this.saveCurrentConversation(userMessage, modelResponses);
        }

        // Auto-speak if enabled
        if (this.config.autoSpeak && modelResponses.length > 0 && modelResponses[0].success) {
            this.audioManager.speak(modelResponses[0].content);
        }
    }

    // Model control functions
    copyModelResponse(windowIndex) {
        const responseElement = this.elements[`modelResponse${windowIndex}`];
        if (responseElement) {
            const text = responseElement.textContent || responseElement.innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification("Respuesta copiada al portapapeles", "success");
            }).catch(err => {
                console.error("Error copiando al portapapeles:", err);
                this.showNotification("Error al copiar al portapapeles", "error");
            });
        }
    }

    speakModelResponse(windowIndex) {
        const responseElement = this.elements[`modelResponse${windowIndex}`];
        if (responseElement) {
            const text = responseElement.textContent || responseElement.innerText;
            this.audioManager.speak(text);
        }
    }

    toggleModel(windowIndex) {
        const selectElement = this.elements[`modelSelect${windowIndex}`];
        const statusElement = this.elements[`modelStatus${windowIndex}`];
        
        if (selectElement && selectElement.value) {
            // Model is selected, deactivate it
            selectElement.value = "";
            statusElement.textContent = "Inactivo";
            statusElement.className = "model-status";
            this.elements[`modelResponse${windowIndex}`].innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-robot"></i>
                    <p>Selecciona un modelo para ver respuestas</p>
                </div>
            `;
            this.elements[`modelTokens${windowIndex}`].textContent = "0 tokens";
            this.elements[`modelTime${windowIndex}`].textContent = "0ms";
        } else {
            // No model selected, show notification
            this.showNotification("Selecciona un modelo primero", "warning");
        }
        
        this.updateActiveModelsDisplay();
    }

    // Utility functions
    formatResponse(content) {
        // Simple markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    estimateTokens(messages) {
        // Simple token estimation (roughly 4 characters per token)
        const text = messages.map(m => m.content).join(' ');
        return Math.ceil(text.length / 4);
    }

    trimMessagesToContext(messages, maxTokens) {
        // Simple context trimming - keep system message and recent messages
        if (messages.length <= 2) return messages;
        
        let totalTokens = this.estimateTokens(messages);
        while (totalTokens > maxTokens && messages.length > 2) {
            // Remove the second message (keep system and most recent)
            messages.splice(1, 1);
            totalTokens = this.estimateTokens(messages);
        }
        
        return messages;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updateInputStats() {
        if (!this.elements.messageInput) return;
        
        const text = this.elements.messageInput.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        if (this.elements.charCount) {
            this.elements.charCount.textContent = charCount;
        }
        if (this.elements.wordCount) {
            this.elements.wordCount.textContent = wordCount;
        }
    }

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (this.elements.sendMessage) {
            this.elements.sendMessage.disabled = isLoading;
            this.elements.sendMessage.innerHTML = isLoading ? 
                '<i class="fas fa-spinner fa-spin"></i>' : 
                '<i class="fas fa-paper-plane"></i>';
        }
    }

    showLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove("hidden");
        }
    }

    hideLoading() {
        if (this.elements.loadingScreen) {
            setTimeout(() => {
                this.elements.loadingScreen.classList.add("hidden");
            }, 500);
        }
    }

    showNotification(message, type = "info", duration = 3000) {
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    toggleSidebar() {
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.toggle("collapsed");
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        
        // Update theme toggle icon
        if (this.elements.themeToggle) {
            const icon = this.elements.themeToggle.querySelector("i");
            if (icon) {
                icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
            }
        }
    }

    initializeSpeech() {
        // Initialize speech recognition and synthesis
        if (this.audioManager) {
            this.audioManager.initialize();
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }

    selectConversation(conversation) {
        this.state.currentConversation = conversation;
        this.renderConversations(); // Re-render to show active state
        // Load conversation messages if needed
    }

    saveCurrentConversation(userMessage, modelResponses) {
        // Implementation for saving conversation
        // This would typically save to IndexedDB via storageManager
    }

    // API Keys Management
    loadApiKeysSettings() {
        // Implementation for loading API keys settings UI
    }

    saveApiKeys() {
        // Implementation for saving API keys
    }

    async testAllConnections() {
        // Implementation for testing all API connections
    }

    // General Settings Management
    loadGeneralSettingsUI() {
        this.elements.contextWindowSizeInput.value = this.config.contextWindowSize;
        this.elements.temperatureSettingInput.value = this.config.temperature;
        this.elements.temperatureValueSpan.textContent = this.config.temperature;
        this.elements.maxTokensSettingInput.value = this.config.maxResponseTokens;
        this.elements.autoSaveSettingCheckbox.checked = this.config.autoSave;
        this.elements.autoSpeakSettingCheckbox.checked = this.config.autoSpeak;
    }

    saveGeneralSettings() {
        try {
            this.config.contextWindowSize = parseInt(this.elements.contextWindowSizeInput.value);
            this.config.temperature = parseFloat(this.elements.temperatureSettingInput.value);
            this.config.maxResponseTokens = parseInt(this.elements.maxTokensSettingInput.value);
            this.config.autoSave = this.elements.autoSaveSettingCheckbox.checked;
            this.config.autoSpeak = this.elements.autoSpeakSettingCheckbox.checked;

            storageManager.saveSettings(this.config);
            this.showNotification("Configuración general guardada correctamente", "success");

            // Update main checkboxes
            this.elements.autoSpeakCheckbox.checked = this.config.autoSpeak;
            this.elements.saveConversationCheckbox.checked = this.config.autoSave;

        } catch (error) {
            console.error("Error guardando configuración general:", error);
            this.showNotification("Error al guardar configuración general", "error");
        }
    }

    // Custom LLM Management
    renderCustomLLMs() {
        // Implementation for rendering custom LLMs
    }

    addCustomLLM() {
        // Implementation for adding custom LLM
    }

    removeCustomLLM(id) {
        // Implementation for removing custom LLM
    }
}

const app = new MultiLLMApp();

// Global functions for modal control
function openModal(modalId) {
    app.openModal(modalId);
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.remove("active");
    });
    // Deactivate all tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Show the selected tab content
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
        tabContent.classList.add("active");
    }
    
    // Activate the selected tab button
    const tabButton = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (tabButton) {
        tabButton.classList.add("active");
    }
}
