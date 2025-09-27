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
            modelResponse1: document.getElementById("model-response-1"),
            modelResponse2: document.getElementById("model-response-2"),
            modelResponse3: document.getElementById("model-response-3"),
            modelStatus1: document.getElementById("model-status-1"),
            modelStatus2: document.getElementById("model-status-2"),
            modelStatus3: document.getElementById("model-status-3"),
            modelTokens1: document.getElementById("model-tokens-1"),
            modelTokens2: document.getElementById("model-tokens-2"),
            modelTokens3: document.getElementById("model-tokens-3"),
            modelTime1: document.getElementById("model-time-1"),
            modelTime2: document.getElementById("model-time-2"),
            modelTime3: document.getElementById("model-time-3"),
            
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
            this.elements.modelSelect3
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
        [this.elements.primaryModelSelect, this.elements.modelSelect1, this.elements.modelSelect2, this.elements.modelSelect3].forEach(select => {
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
        [this.elements.primaryModelSelect, this.elements.modelSelect1, this.elements.modelSelect2, this.elements.modelSelect3].forEach(select => {
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
                this.elements.modelSelect3.value
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
        if (this.config.autoSpeak && primaryResponse && primaryResponse.success) {
            this.audioManager.speak(primaryResponse.content);
        }

        this.updateStats();
    }

    async saveCurrentConversation(userMessage, modelResponses) {
        if (!this.state.currentConversation) {
            this.state.currentConversation = { 
                id: Date.now(), 
                title: userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""), 
                messages: [], 
                message_count: 0, 
                updated_at: Date.now() 
            };
        }

        this.state.currentConversation.messages.push({ role: "user", content: userMessage, timestamp: Date.now() });
        modelResponses.forEach(res => {
            if (res.success) {
                this.state.currentConversation.messages.push({ role: "assistant", content: res.content, model_id: res.model_id, timestamp: Date.now() });
            }
        });
        this.state.currentConversation.message_count = this.state.currentConversation.messages.length;
        this.state.currentConversation.updated_at = Date.now();

        await storageManager.saveConversation(this.state.currentConversation);
        await this.loadConversations(); // Reload sidebar conversations
    }

    trimMessagesToContext(messages, contextWindow) {
        // Simplified token estimation: 1 token ≈ 4 chars
        let currentTokens = messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
        while (currentTokens > contextWindow && messages.length > 1) {
            messages.shift(); // Remove oldest message
            currentTokens = messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
        }
        return messages;
    }

    estimateTokens(messages) {
        return messages.reduce((sum, msg) => sum + msg.content.length / 4, 0);
    }

    formatResponse(text) {
        // Convert markdown básico a HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`(.*?)`/g, "<code>$1</code>")
            .replace(/\n/g, "<br>");
    }

    updateInputStats() {
        const text = this.elements.messageInput.value;
        this.elements.charCount.textContent = text.length;
        this.elements.wordCount.textContent = text.split(/\s+/).filter(word => word.length > 0).length;
    }

    toggleSidebar() {
        this.elements.sidebar.classList.toggle("collapsed");
    }

    openModal(modalId) {
        document.getElementById(modalId).classList.add("active");
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove("active");
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        this.elements.themeToggle.querySelector("i").className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }

    initializeSpeech() {
        // Check and set theme
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            document.documentElement.setAttribute("data-theme", savedTheme);
            this.elements.themeToggle.querySelector("i").className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
        } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.setAttribute("data-theme", "dark");
            this.elements.themeToggle.querySelector("i").className = "fas fa-sun";
        }
    }

    showLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove("hidden");
        }
    }

    hideLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add("hidden");
        }
    }

    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (isLoading) {
            this.showLoading();
        } else {
            this.hideLoading();
        }
        
        // Disable/enable send button
        if (this.elements.sendMessage) {
            this.elements.sendMessage.disabled = isLoading;
        }
    }

    showNotification(message, type = "info", duration = 3000) {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        this.elements.notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.classList.add("show");
        }, 10);

        setTimeout(() => {
            notification.classList.remove("show");
            notification.addEventListener("transitionend", () => notification.remove());
        }, duration);
    }

    getNotificationIcon(type) {
        switch (type) {
            case "success": return "fa-check-circle";
            case "error": return "fa-times-circle";
            case "warning": return "fa-exclamation-triangle";
            case "info": return "fa-info-circle";
            default: return "fa-bell";
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }

    // --- API Key Management (from PHP version, adapted for static) ---
    async loadApiKeysSettings() {
        // Load current API keys from local storage
        this.state.apiKeys = storageManager.getApiKeys();
        
        // Generate forms
        this.generateProviderApiKeysForm();
        this.generateModelApiKeysForm();
    }
    
    generateProviderApiKeysForm() {
        const container = this.elements.providerApiKeys;
        if (!container) return;
        
        container.innerHTML = ``;
        
        this.state.providers.forEach(provider => {
            const providerDiv = document.createElement("div");
            providerDiv.className = "api-key-group";
            
            const providerApiKey = this.state.apiKeys[provider.id] || ``;

            providerDiv.innerHTML = `
                <div class="api-key-header">
                    <div class="provider-info">
                        <i class="fas fa-server"></i>
                        <span class="provider-name">${provider.name}</span>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="app.testProviderConnection('${provider.id}')">
                        <i class="fas fa-plug"></i> Probar
                    </button>
                </div>
                <div class="api-key-input">
                    <label for="provider-key-${provider.id}">Clave API para ${provider.name}:</label>
                    <div class="input-group">
                        <input 
                            type="password" 
                            id="provider-key-${provider.id}" 
                            class="form-control" 
                            placeholder="Ingresa la clave API..."
                            value="${providerApiKey}"
                        >
                        <button class="btn btn-outline-secondary" type="button" onclick="app.togglePasswordVisibility('provider-key-${provider.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <small class="form-text text-muted">
                        Esta clave se usará para todos los modelos de ${provider.name} que no tengan clave específica.
                    </small>
                </div>
            `;
            
            container.appendChild(providerDiv);
        });
    }
    
    generateModelApiKeysForm() {
        const container = this.elements.modelApiKeys;
        if (!container) return;
        
        container.innerHTML = ``;
        
        // Agrupar modelos por proveedor
        const modelsByProvider = {};
        this.state.models.forEach(model => {
            if (!modelsByProvider[model.provider_id]) {
                modelsByProvider[model.provider_id] = [];
            }
            modelsByProvider[model.provider_id].push(model);
        });
        
        Object.keys(modelsByProvider).forEach(providerId => {
            const provider = this.state.providers.find(p => p.id === providerId);
            if (!provider) return;
            
            const providerSection = document.createElement("div");
            providerSection.className = "model-provider-section";
            
            const providerHeader = document.createElement("div");
            providerHeader.className = "model-provider-header";
            providerHeader.innerHTML = `
                <h5>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                    ${provider.name} (${modelsByProvider[providerId].length} modelos)
                </h5>
                <button class="btn btn-sm btn-outline-primary" onclick="app.toggleProviderModels('${providerId}')">
                    <i class="fas fa-chevron-down"></i>
                </button>
            `;
            
            const modelsContainer = document.createElement("div");
            modelsContainer.className = "models-container collapsed";
            modelsContainer.id = `models-${providerId}`;
            
            modelsByProvider[providerId].forEach(model => {
                const modelApiKey = this.state.apiKeys[model.id] || ``;

                const modelDiv = document.createElement("div");
                modelDiv.className = "model-api-key-item";
                
                modelDiv.innerHTML = `
                    <div class="model-info">
                        <div class="model-name">
                            <i class="fas fa-robot"></i>
                            <span>${model.display_name}</span>
                            <span class="model-id">(${model.id})</span>
                        </div>
                        <div class="model-details">
                            <span class="model-detail">Max tokens: ${model.max_tokens}</span>
                            <span class="model-detail">Contexto: ${model.context_window}</span>
                            <span class="model-detail">Costo: $${model.cost_per_token}/token</span>
                        </div>
                    </div>
                    <div class="model-api-key-input">
                        <div class="input-group">
                            <input 
                                type="password" 
                                id="model-key-${model.id}" 
                                class="form-control form-control-sm" 
                                placeholder="Clave API específica (opcional)..."
                                value="${modelApiKey}"
                            >
                            <button class="btn btn-outline-secondary btn-sm" type="button" onclick="app.togglePasswordVisibility('model-key-${model.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="app.testModelConnection('${model.id}')">
                                <i class="fas fa-plug"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                modelsContainer.appendChild(modelDiv);
            });
            
            providerSection.appendChild(providerHeader);
            providerSection.appendChild(modelsContainer);
            container.appendChild(providerSection);
        });
    }
    
    toggleProviderModels(providerId) {
        const container = document.getElementById(`models-${providerId}`);
        const button = container.previousElementSibling.querySelector("button");
        const icon = button.querySelector("i");
        
        if (container.classList.contains("collapsed")) {
            container.classList.remove("collapsed");
            icon.classList.remove("fa-chevron-down");
            icon.classList.add("fa-chevron-up");
        } else {
            container.classList.add("collapsed");
            icon.classList.remove("fa-chevron-up");
            icon.classList.add("fa-chevron-down");
        }
    }
    
    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        const icon = button.querySelector("i");
        
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
    
    async saveApiKeys() {
        try {
            this.setLoading(true);
            
            // Recopilar claves API de proveedores
            const providerKeys = {};
            this.state.providers.forEach(provider => {
                const input = document.getElementById(`provider-key-${provider.id}`);
                if (input && input.value.trim()) {
                    providerKeys[provider.id] = input.value.trim();
                }
            });
            
            // Recopilar claves API de modelos
            const modelKeys = {};
            this.state.models.forEach(model => {
                const input = document.getElementById(`model-key-${model.id}`);
                if (input && input.value.trim()) {
                    modelKeys[model.id] = input.value.trim();
                }
            });
            
            // Guardar en el estado local y en storageManager
            this.state.apiKeys = { ...providerKeys, ...modelKeys };
            storageManager.saveApiKeys(this.state.apiKeys);
            
            this.showNotification("Configuración de API keys guardada correctamente", "success");
            
        } catch (error) {
            console.error("Error guardando configuración de API keys:", error);
            this.showNotification("Error al guardar configuración de API keys", "error");
        } finally {
            this.setLoading(false);
        }
    }
    
    async testProviderConnection(providerId) {
        try {
            this.setLoading(true);
            const provider = this.state.providers.find(p => p.id === providerId);
            if (!provider) {
                this.showNotification("Proveedor no encontrado", "error");
                return;
            }

            const apiKey = provider.getApiKeyForModel(providerId, this.state.apiKeys);
            
            if (!apiKey) {
                this.showNotification("Por favor, ingresa una clave API para probar la conexión", "warning");
                return;
            }
            
            // Simplified test: just check if API key is present
            // A more robust test would involve making a small API call
            this.showNotification(`Probando conexión con ${provider.name}...`, "info");
            const client = new LLMClient(provider, provider.models[0], apiKey); // Use first model for test
            await client.testConnection();
            
            this.showNotification(`Conexión exitosa con ${provider.name}`, "success");
            
        } catch (error) {
            console.error("Error probando conexión:", error);
            this.showNotification(`Error de conexión con ${providerId}: ${error.message}`, "error");
        } finally {
            this.setLoading(false);
        }
    }
    
    async testModelConnection(modelId) {
        try {
            this.setLoading(true);
            const modelInfo = this.state.models.find(m => m.id === modelId);
            if (!modelInfo) {
                this.showNotification("Modelo no encontrado", "error");
                return;
            }
            
            const provider = this.state.providers.find(p => p.id === modelInfo.provider_id);
            if (!provider) {
                this.showNotification("Proveedor no encontrado para el modelo", "error");
                return;
            }

            const apiKey = provider.getApiKeyForModel(modelId, this.state.apiKeys);
            
            if (!apiKey) {
                this.showNotification("Por favor, configura una clave API para el modelo o su proveedor", "warning");
                return;
            }
            
            this.showNotification(`Probando conexión con ${modelInfo.display_name}...`, "info");
            const client = new LLMClient(provider, modelInfo, apiKey);
            await client.testConnection();
            
            this.showNotification(`Conexión exitosa con ${modelInfo.display_name}`, "success");
            
        } catch (error) {
            console.error("Error probando conexión del modelo:", error);
            this.showNotification(`Error de conexión con ${modelInfo.display_name}: ${error.message}`, "error");
        } finally {
            this.setLoading(false);
        }
    }
    
    async testAllConnections() {
        try {
            this.setLoading(true);
            
            const results = [];
            
            // Probar conexiones de proveedores
            for (const provider of this.state.providers) {
                const apiKey = provider.getApiKeyForModel(provider.id, this.state.apiKeys); // Use provider ID as model ID for provider key
                
                if (apiKey) {
                    try {
                        const client = new LLMClient(provider, provider.models[0], apiKey); // Use first model for test
                        await client.testConnection();
                        results.push({
                            type: "provider",
                            name: provider.name,
                            success: true,
                        });
                    } catch (error) {
                        results.push({
                            type: "provider",
                            name: provider.name,
                            success: false,
                            error: error.message
                        });
                    }
                }
            }
            
            // Probar conexiones de modelos individuales (solo si tienen clave específica)
            for (const model of this.state.models) {
                if (this.state.apiKeys[model.id]) { // Check if model has a specific API key
                    const provider = this.state.providers.find(p => p.id === model.provider_id);
                    if (!provider) continue;

                    try {
                        const client = new LLMClient(provider, model, this.state.apiKeys[model.id]);
                        await client.testConnection();
                        results.push({
                            type: "model",
                            name: model.display_name,
                            success: true,
                        });
                    } catch (error) {
                        results.push({
                            type: "model",
                            name: model.display_name,
                            success: false,
                            error: error.message
                        });
                    }
                }
            }

            // Mostrar resultados
            const successCount = results.filter(r => r.success).length;
            const totalCount = results.length;
            
            if (totalCount === 0) {
                this.showNotification("No hay claves API configuradas para probar", "warning");
            } else if (successCount === totalCount) {
                this.showNotification(`Todas las ${totalCount} conexiones exitosas`, "success");
            } else {
                this.showNotification(`${successCount}/${totalCount} conexiones exitosas. Revisa los errores.`, "warning");
                results.filter(r => !r.success).forEach(r => {
                    this.showNotification(`Error en ${r.type} ${r.name}: ${r.error}`, "error", 5000);
                });
            }
            
        } catch (error) {
            console.error("Error probando todas las conexiones:", error);
            this.showNotification("Error al probar las conexiones", "error");
        } finally {
            this.setLoading(false);
        }
    }

    // --- General Settings Management ---
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

    // --- Custom LLM Management ---
    renderCustomLLMs() {
        const container = this.elements.customLLMList;
        if (!container) return;

        container.innerHTML = ``;

        if (this.state.customLLMs.length === 0) {
            container.innerHTML = `<p class="text-muted">No hay LLMs personalizados añadidos.</p>`;
            return;
        }

        this.state.customLLMs.forEach(llm => {
            const llmDiv = document.createElement("div");
            llmDiv.className = "custom-llm-item";
            llmDiv.innerHTML = `
                <div class="custom-llm-item-info">
                    <h5>${llm.name} (${llm.id})</h5>
                    <p>Proveedor: ${llm.provider} | URL: ${llm.apiUrl}</p>
                </div>
                <div class="custom-llm-actions">
                    <button class="btn btn-sm btn-danger" onclick="app.removeCustomLLM('${llm.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            container.appendChild(llmDiv);
        });
    }

    addCustomLLM() {
        const id = this.elements.customLLMIdInput.value.trim();
        const name = this.elements.customLLMNameInput.value.trim();
        const provider = this.elements.customLLMProviderInput.value.trim();
        const apiUrl = this.elements.customLLMApiUrlInput.value.trim();
        const apiKey = this.elements.customLLMApiKeyInput.value.trim();
        const maxTokens = parseInt(this.elements.customLLMMaxTokensInput.value);
        const contextWindow = parseInt(this.elements.customLLMContextWindowInput.value);
        const cost = parseFloat(this.elements.customLLMCostInput.value);
        const capabilities = this.elements.customLLMCapabilitiesInput.value.split(",").map(c => c.trim()).filter(c => c);

        if (!id || !name || !provider || !apiUrl || isNaN(maxTokens) || isNaN(contextWindow) || isNaN(cost)) {
            this.showNotification("Por favor, rellena todos los campos obligatorios para el LLM personalizado.", "error");
            return;
        }

        if (this.state.customLLMs.some(llm => llm.id === id)) {
            this.showNotification("Ya existe un LLM personalizado con este ID.", "error");
            return;
        }

        const newLLM = {
            id, name, provider, apiUrl, apiKey, maxTokens, contextWindow, cost, capabilities
        };

        this.state.customLLMs.push(newLLM);
        storageManager.saveCustomLLMs(this.state.customLLMs);
        this.state.apiKeys[id] = apiKey; // Save API key for custom LLM
        storageManager.saveApiKeys(this.state.apiKeys);

        this.showNotification(`LLM personalizado '${name}' añadido correctamente.`, "success");
        this.clearCustomLLMForm();
        this.loadInitialData(); // Reload providers and models
    }

    removeCustomLLM(id) {
        this.state.customLLMs = this.state.customLLMs.filter(llm => llm.id !== id);
        storageManager.saveCustomLLMs(this.state.customLLMs);
        delete this.state.apiKeys[id]; // Remove API key for custom LLM
        storageManager.saveApiKeys(this.state.apiKeys);

        this.showNotification(`LLM personalizado '${id}' eliminado.`, "info");
        this.loadInitialData(); // Reload providers and models
    }

    clearCustomLLMForm() {
        this.elements.customLLMIdInput.value = ``;
        this.elements.customLLMNameInput.value = ``;
        this.elements.customLLMProviderInput.value = ``;
        this.elements.customLLMApiUrlInput.value = ``;
        this.elements.customLLMApiKeyInput.value = ``;
        this.elements.customLLMMaxTokensInput.value = 4096;
        this.elements.customLLMContextWindowInput.value = 8192;
        this.elements.customLLMCostInput.value = 0;
        this.elements.customLLMCapabilitiesInput.value = "chat,completion";
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


