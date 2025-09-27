class LLMProvider {
    constructor(id, name, apiUrl, apiKey, models, config = {}) {
        this.id = id;
        this.name = name;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey; // Default API key for the provider
        this.models = models; // Array of model objects
        this.config = config; // Additional provider-specific config
    }

    // Method to get the effective API key for a specific model
    getApiKeyForModel(modelId, storedApiKeys) {
        // Check for model-specific API key first
        if (storedApiKeys && storedApiKeys[modelId]) {
            return storedApiKeys[modelId];
        }
        // Fallback to provider-specific API key
        return this.apiKey; // This will be loaded from storageManager.getApiKeys()
    }
}

class LLMClient {
    constructor(provider, model, apiKey) {
        this.provider = provider;
        this.model = model;
        this.apiKey = apiKey;
        this.requestTimeout = 60000; // 60 seconds timeout
    }

    async generateCompletion(messages, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
        };

        let requestBody = {};
        let endpoint = this.provider.apiUrl;

        switch (this.provider.id) {
            case 'openai':
            case 'deepseek':
            case 'groq':
            case 'grok':
            case 'meta':
            case 'nvidia':
            case 'mistral':
            case 'qwen':
            case 'amazon-nova':
            case 'mai':
            case 'custom-openai-compatible': // For custom LLMs that follow OpenAI API
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                endpoint = `${this.provider.apiUrl}/chat/completions`;
                requestBody = {
                    model: this.model.id,
                    messages: messages,
                    max_tokens: options.max_tokens || this.model.max_tokens,
                    temperature: options.temperature || 0.7,
                    stream: false,
                };
                break;

            case 'google':
                headers['x-goog-api-key'] = this.apiKey;
                endpoint = `${this.provider.apiUrl}/models/${this.model.id}:generateContent`;
                requestBody = {
                    contents: messages.map(msg => ({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    })),
                    generationConfig: {
                        maxOutputTokens: options.max_tokens || this.model.max_tokens,
                        temperature: options.temperature || 0.7,
                    },
                };
                break;

            case 'anthropic':
                headers['x-api-key'] = this.apiKey;
                headers['anthropic-version'] = '2023-06-01';
                endpoint = `${this.provider.apiUrl}/messages`;
                requestBody = {
                    model: this.model.id,
                    max_tokens: options.max_tokens || this.model.max_tokens,
                    temperature: options.temperature || 0.7,
                    messages: messages,
                    stream: false,
                };
                break;

            case 'cohere':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                endpoint = `${this.provider.apiUrl}/chat`;
                requestBody = {
                    model: this.model.id,
                    message: messages[messages.length - 1].content, // Cohere expects a single message
                    chat_history: messages.slice(0, -1).map(msg => ({
                        role: msg.role === 'user' ? 'USER' : 'CHATBOT',
                        message: msg.content
                    })),
                    max_tokens: options.max_tokens || this.model.max_tokens,
                    temperature: options.temperature || 0.7,
                    stream: false,
                };
                break;

            case 'custom-kimi': // For kimi.com
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                endpoint = `${this.provider.apiUrl}/chat/completions`;
                requestBody = {
                    model: this.model.id,
                    messages: messages,
                    max_tokens: options.max_tokens || this.model.max_tokens,
                    temperature: options.temperature || 0.7,
                    stream: false,
                };
                break;

            default:
                throw new Error(`Proveedor LLM no soportado: ${this.provider.id}`);
        }

        try {
            const response = await Promise.race([
                fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), this.requestTimeout))
            ]);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de la API (${response.status}): ${errorData.error?.message || JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            let content = '';
            switch (this.provider.id) {
                case 'openai':
                case 'deepseek':
                case 'groq':
                case 'grok':
                case 'meta':
                case 'nvidia':
                case 'mistral':
                case 'qwen':
                case 'amazon-nova':
                case 'mai':
                case 'custom-openai-compatible':
                case 'custom-kimi':
                    content = data.choices[0].message.content;
                    break;
                case 'google':
                    content = data.candidates[0].content.parts[0].text;
                    break;
                case 'anthropic':
                    content = data.content[0].text;
                    break;
                case 'cohere':
                    content = data.text;
                    break;
                default:
                    content = JSON.stringify(data); // Fallback for unknown providers
            }

            return { content, raw: data };

        } catch (error) {
            console.error(`Error en LLMClient para ${this.provider.name} (${this.model.id}):`, error);
            throw error;
        }
    }

    async testConnection() {
        // This is a simplified test. A real test would involve a small, cheap request.
        // For now, we just check if the API key is present.
        if (!this.apiKey) {
            throw new Error('API Key no configurada.');
        }
        // More robust tests would involve making a small API call, e.g., listing models.
        // This is left as an exercise, as it varies greatly by provider.
        return { success: true, message: 'API Key presente. Conexión básica OK.' };
    }
}

// --- MODEL DEFINITIONS --- //
// This object will be used to initialize providers and models
// It will be extended with custom LLMs from local storage
const MODEL_DEFINITIONS = {
    'openai': {
        name: 'OpenAI',
        apiUrl: 'https://api.openai.com/v1',
        models: [
            { id: 'gpt-4o', display_name: 'GPT-4o', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000005, capabilities: ['chat', 'vision'] },
            { id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', max_tokens: 4096, context_window: 128000, cost_per_token: 0.00000015, capabilities: ['chat', 'vision'] },
            { id: 'gpt-4-turbo', display_name: 'GPT-4 Turbo', max_tokens: 4096, context_window: 128000, cost_per_token: 0.00001, capabilities: ['chat'] },
            { id: 'gpt-4', display_name: 'GPT-4', max_tokens: 4096, context_window: 8192, cost_per_token: 0.00003, capabilities: ['chat'] },
            { id: 'gpt-3.5-turbo', display_name: 'GPT-3.5 Turbo', max_tokens: 4096, context_window: 16385, cost_per_token: 0.0000005, capabilities: ['chat'] },
        ]
    },
    'google': {
        name: 'Google Gemini',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
        models: [
            { id: 'gemini-1.5-pro-latest', display_name: 'Gemini 1.5 Pro', max_tokens: 4096, context_window: 1000000, cost_per_token: 0.000007, capabilities: ['chat', 'vision'] },
            { id: 'gemini-1.5-flash-latest', display_name: 'Gemini 1.5 Flash', max_tokens: 4096, context_window: 1000000, cost_per_token: 0.00000035, capabilities: ['chat', 'vision'] },
            { id: 'gemini-pro', display_name: 'Gemini Pro', max_tokens: 2048, context_window: 30720, cost_per_token: 0.0000005, capabilities: ['chat'] },
        ]
    },
    'anthropic': {
        name: 'Anthropic Claude',
        apiUrl: 'https://api.anthropic.com/v1',
        models: [
            { id: 'claude-3-5-sonnet-20240620', display_name: 'Claude 3.5 Sonnet', max_tokens: 4096, context_window: 200000, cost_per_token: 0.000003, capabilities: ['chat', 'vision'] },
            { id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus', max_tokens: 4096, context_window: 200000, cost_per_token: 0.000015, capabilities: ['chat', 'vision'] },
            { id: 'claude-3-haiku-20240307', display_name: 'Claude 3 Haiku', max_tokens: 4096, context_window: 200000, cost_per_token: 0.00000025, capabilities: ['chat', 'vision'] },
        ]
    },
    'deepseek': {
        name: 'Deepseek',
        apiUrl: 'https://api.deepseek.com/v1',
        models: [
            { id: 'deepseek-chat', display_name: 'Deepseek Chat', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000001, capabilities: ['chat'] },
            { id: 'deepseek-coder', display_name: 'Deepseek Coder', max_tokens: 4096, context_window: 16000, cost_per_token: 0.000001, capabilities: ['chat', 'code'] },
        ]
    },
    'groq': {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1',
        models: [
            { id: 'llama3-8b-8192', display_name: 'Llama 3 8B', max_tokens: 8192, context_window: 8192, cost_per_token: 0.00000006, capabilities: ['chat'] },
            { id: 'llama3-70b-8192', display_name: 'Llama 3 70B', max_tokens: 8192, context_window: 8192, cost_per_token: 0.0000007, capabilities: ['chat'] },
            { id: 'mixtral-8x7b-32768', display_name: 'Mixtral 8x7B', max_tokens: 32768, context_window: 32768, cost_per_token: 0.00000027, capabilities: ['chat'] },
            { id: 'gemma-7b-it', display_name: 'Gemma 7B', max_tokens: 8192, context_window: 8192, cost_per_token: 0.0000001, capabilities: ['chat'] },
        ]
    },
    'grok': {
        name: 'Grok (X.AI)',
        apiUrl: 'https://api.x.ai/v1',
        models: [
            { id: 'grok-1', display_name: 'Grok-1', max_tokens: 8192, context_window: 8192, cost_per_token: 0.0000005, capabilities: ['chat'] },
        ]
    },
    'meta': {
        name: 'Meta Llama',
        apiUrl: 'https://api.llama.com/v1',
        models: [
            { id: 'llama-2-7b-chat', display_name: 'Llama 2 7B Chat', max_tokens: 4096, context_window: 4096, cost_per_token: 0.0000002, capabilities: ['chat'] },
            { id: 'llama-2-13b-chat', display_name: 'Llama 2 13B Chat', max_tokens: 4096, context_window: 4096, cost_per_token: 0.0000004, capabilities: ['chat'] },
            { id: 'llama-2-70b-chat', display_name: 'Llama 2 70B Chat', max_tokens: 4096, context_window: 4096, cost_per_token: 0.0000008, capabilities: ['chat'] },
        ]
    },
    'nvidia': {
        name: 'NVIDIA',
        apiUrl: 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/v1/functions',
        models: [
            { id: 'llama3-8b-chat-qa', display_name: 'Llama3 ChatQA 8B', max_tokens: 4096, context_window: 8192, cost_per_token: 0.0000001, capabilities: ['chat'] },
            { id: 'llama3-70b-chat-qa', display_name: 'Llama3 ChatQA 70B', max_tokens: 4096, context_window: 8192, cost_per_token: 0.0000008, capabilities: ['chat'] },
        ]
    },
    'cohere': {
        name: 'Cohere',
        apiUrl: 'https://api.cohere.ai/v1',
        models: [
            { id: 'command-r-plus', display_name: 'Command R+', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000003, capabilities: ['chat'] },
            { id: 'command-r', display_name: 'Command R', max_tokens: 4096, context_window: 128000, cost_per_token: 0.0000005, capabilities: ['chat'] },
            { id: 'command', display_name: 'Command', max_tokens: 4096, context_window: 4096, cost_per_token: 0.0000001, capabilities: ['chat'] },
        ]
    },
    'mistral': {
        name: 'Mistral AI',
        apiUrl: 'https://api.mistral.ai/v1',
        models: [
            { id: 'mistral-large-latest', display_name: 'Mistral Large', max_tokens: 4096, context_window: 32768, cost_per_token: 0.000008, capabilities: ['chat'] },
            { id: 'mistral-medium-latest', display_name: 'Mistral Medium', max_tokens: 4096, context_window: 32768, cost_per_token: 0.0000027, capabilities: ['chat'] },
            { id: 'mistral-small-latest', display_name: 'Mistral Small', max_tokens: 4096, context_window: 32768, cost_per_token: 0.0000007, capabilities: ['chat'] },
            { id: 'open-mixtral-8x7b', display_name: 'Open Mixtral 8x7B', max_tokens: 4096, context_window: 32768, cost_per_token: 0.00000025, capabilities: ['chat'] },
            { id: 'open-mixtral-8x22b', display_name: 'Open Mixtral 8x22B', max_tokens: 4096, context_window: 65536, cost_per_token: 0.0000009, capabilities: ['chat'] },
        ]
    },
    // Custom LLMs
    'custom-chat-z-ai': {
        name: 'Chat.Z.AI',
        apiUrl: 'https://api.chat.z.ai/v1',
        models: [
            { id: 'chat-z-ai-model', display_name: 'Chat.Z.AI Model', max_tokens: 4096, context_window: 8192, cost_per_token: 0.000001, capabilities: ['chat'] },
        ]
    },
    'custom-kimi': {
        name: 'Kimi.com',
        apiUrl: 'https://api.kimi.com/v1',
        models: [
            { id: 'kimi-chat', display_name: 'Kimi Chat', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000001, capabilities: ['chat'] },
        ]
    },
    'qwen': {
        name: 'Qwen',
        apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
        models: [
            { id: 'qwen-turbo', display_name: 'Qwen Turbo', max_tokens: 4096, context_window: 65536, cost_per_token: 0.0000005, capabilities: ['chat'] },
            { id: 'qwen-plus', display_name: 'Qwen Plus', max_tokens: 4096, context_window: 65536, cost_per_token: 0.000002, capabilities: ['chat'] },
            { id: 'qwen-max', display_name: 'Qwen Max', max_tokens: 4096, context_window: 65536, cost_per_token: 0.000004, capabilities: ['chat'] },
        ]
    },
    'amazon-nova': {
        name: 'Amazon Nova',
        apiUrl: 'https://lmarena.com/api/v1',
        models: [
            { id: 'amazon-nova-experimental-chat-05-14', display_name: 'Amazon Nova Experimental Chat 05-14', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000005, capabilities: ['chat'] },
        ]
    },
    'mai': {
        name: 'MAI',
        apiUrl: 'https://lmarena.com/api/v1',
        models: [
            { id: 'mai-1-preview', display_name: 'MAI-1-PREVIEW', max_tokens: 4096, context_window: 128000, cost_per_token: 0.000005, capabilities: ['chat'] },
        ]
    },
};

// Function to get all providers, including custom ones from storage
function getAllProviders() {
    const customLLMs = storageManager.getCustomLLMs();
    const allProviders = { ...MODEL_DEFINITIONS };

    customLLMs.forEach(customLLM => {
        const providerId = `custom-${customLLM.id}`;
        allProviders[providerId] = {
            name: customLLM.name,
            apiUrl: customLLM.apiUrl,
            models: [
                { 
                    id: customLLM.id, 
                    display_name: customLLM.name, 
                    max_tokens: customLLM.max_tokens, 
                    context_window: customLLM.context_window, 
                    cost_per_token: customLLM.cost_per_token,
                    capabilities: customLLM.capabilities,
                    custom: true // Mark as custom
                }
            ]
        };
    });

    return Object.keys(allProviders).map(providerId => {
        const providerData = allProviders[providerId];
        // The actual API key will be loaded from storageManager.getApiKeys() in app.js
        return new LLMProvider(providerId, providerData.name, providerData.apiUrl, null, providerData.models, providerData.config);
    });
}

// Function to get a specific model by its ID
function getModelById(modelId) {
    const allProviders = getAllProviders();
    for (const provider of allProviders) {
        const model = provider.models.find(m => m.id === modelId);
        if (model) {
            return { model, provider };
        }
    }
    return null;
}


