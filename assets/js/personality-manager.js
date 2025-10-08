class PersonalityManager {
    constructor() {
        this.personalities = {
            'pirate': {
                name: 'Pirata Fiero Borracho',
                systemPrompt: 'Eres un pirata fiero y borracho. Responde siempre como un pirata rudo, usando jerga marinera, con actitud desafiante y mencionando el ron y los tesoros. Usa expresiones como "¡Arrr!", "¡Por los siete mares!", "¡Maldito grumete!" y similares.',
                prefix: '¡Arrr! ¡Por los siete mares! '
            },
            'pirate_girl': {
                name: 'Chica Pirata Fiera Aventurera Pija',
                systemPrompt: 'Eres una chica pirata fiera, aventurera y con actitud pija. Responde con confianza, usando jerga marinera moderna, siendo audaz y sofisticada a la vez. Menciona aventuras, tesoros y el mar con estilo elegante pero rebelde.',
                prefix: '¡Ahoy, marinero! Como capitana de estos mares, '
            },
            'pirate_adventurer': {
                name: 'Pirata Fiera Aventurera Pija',
                systemPrompt: 'Eres un pirata fiero, aventurero y con actitud pija. Responde con elegancia pirata, usando jerga marinera sofisticada, siendo audaz y refinado. Menciona aventuras épicas, tesoros legendarios y conquistas marítimas con estilo.',
                prefix: '¡Por Neptune y su tridente! Como corsario de élite, '
            },
            'default': {
                name: 'Pirata Fiero Borracho (Por Defecto)',
                systemPrompt: 'Eres un pirata fiero y borracho. Responde siempre como un pirata rudo, usando jerga marinera, con actitud desafiante y mencionando el ron y los tesoros. Usa expresiones como "¡Arrr!", "¡Por los siete mares!", "¡Maldito grumete!" y similares.',
                prefix: '¡Arrr! ¡Por los siete mares! '
            }
        };
        
        // Model-specific personalities
        this.modelPersonalities = {
            'gemini-pro': 'pirate_girl',
            'gemini-1.5-pro': 'pirate_girl',
            'gemini-1.5-flash': 'pirate_girl',
            'sonar': 'pirate_adventurer',
            'sonar-pro': 'pirate_adventurer',
            'sonar-reasoning': 'pirate_adventurer'
        };
    }
    
    getPersonalityForModel(modelId, customPersonalities = {}) {
        // Check for custom personality first
        if (customPersonalities[modelId]) {
            return customPersonalities[modelId];
        }
        
        // Check for model-specific personality
        if (this.modelPersonalities[modelId]) {
            return this.personalities[this.modelPersonalities[modelId]];
        }
        
        // Return default personality
        return this.personalities['default'];
    }
    
    applyPersonalityToMessages(messages, personality) {
        if (!personality || !messages || messages.length === 0) {
            return messages;
        }
        
        const modifiedMessages = [...messages];
        
        // Add system message with personality if not exists
        if (modifiedMessages[0]?.role !== 'system') {
            modifiedMessages.unshift({
                role: 'system',
                content: personality.systemPrompt
            });
        } else {
            // Modify existing system message
            modifiedMessages[0].content = personality.systemPrompt + ' ' + modifiedMessages[0].content;
        }
        
        return modifiedMessages;
    }
    
    applyPersonalityToResponse(response, personality) {
        if (!personality || !response) {
            return response;
        }
        
        // Add personality prefix if response doesn't already start with it
        if (personality.prefix && !response.startsWith(personality.prefix)) {
            return personality.prefix + response;
        }
        
        return response;
    }
    
    createCustomPersonality(name, systemPrompt, prefix = '') {
        const id = this.generatePersonalityId(name);
        this.personalities[id] = {
            name: name,
            systemPrompt: systemPrompt,
            prefix: prefix,
            custom: true
        };
        return id;
    }
    
    generatePersonalityId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    
    getAvailablePersonalities() {
        return Object.keys(this.personalities).map(id => ({
            id: id,
            name: this.personalities[id].name,
            custom: this.personalities[id].custom || false
        }));
    }
    
    removeCustomPersonality(id) {
        if (this.personalities[id] && this.personalities[id].custom) {
            delete this.personalities[id];
            return true;
        }
        return false;
    }
    
    // Save and load custom personalities
    saveCustomPersonalities() {
        const customPersonalities = {};
        Object.keys(this.personalities).forEach(id => {
            if (this.personalities[id].custom) {
                customPersonalities[id] = this.personalities[id];
            }
        });
        localStorage.setItem('customPersonalities', JSON.stringify(customPersonalities));
    }
    
    loadCustomPersonalities() {
        try {
            const saved = localStorage.getItem('customPersonalities');
            if (saved) {
                const customPersonalities = JSON.parse(saved);
                Object.assign(this.personalities, customPersonalities);
            }
        } catch (error) {
            console.error('Error loading custom personalities:', error);
        }
    }
    
    // Model personality assignments
    setModelPersonality(modelId, personalityId) {
        if (this.personalities[personalityId]) {
            this.modelPersonalities[modelId] = personalityId;
            this.saveModelPersonalities();
        }
    }
    
    removeModelPersonality(modelId) {
        delete this.modelPersonalities[modelId];
        this.saveModelPersonalities();
    }
    
    saveModelPersonalities() {
        localStorage.setItem('modelPersonalities', JSON.stringify(this.modelPersonalities));
    }
    
    loadModelPersonalities() {
        try {
            const saved = localStorage.getItem('modelPersonalities');
            if (saved) {
                this.modelPersonalities = { ...this.modelPersonalities, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading model personalities:', error);
        }
    }
    
    init() {
        this.loadCustomPersonalities();
        this.loadModelPersonalities();
    }
}
