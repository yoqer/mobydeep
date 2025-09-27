class Translator {
    constructor(app) {
        this.app = app;
        this.translationCache = {};
        this.defaultTargetLang = 'en'; // Default target language
    }

    async translateText(text, targetLang = this.defaultTargetLang, sourceLang = 'auto') {
        if (!text || text.trim() === '') {
            return '';
        }

        const cacheKey = `${sourceLang}-${targetLang}-${text}`;
        if (this.translationCache[cacheKey]) {
            return this.translationCache[cacheKey];
        }

        try {
            // Using LibreTranslate API (self-hosted or public instance)
            // Public instance: https://libretranslate.com/docs
            const libreTranslateApiUrl = 'https://translate.argosopentech.com/translate'; // Example public instance

            const response = await fetch(libreTranslateApiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    q: text,
                    source: sourceLang,
                    target: targetLang,
                    format: 'text',
                    api_key: '' // LibreTranslate might require an API key for self-hosted instances
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error de traducción (${response.status}): ${errorData.error || JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const translatedText = data.translatedText;
            this.translationCache[cacheKey] = translatedText;
            return translatedText;

        } catch (error) {
            console.error('Error durante la traducción:', error);
            this.app.showNotification('Error al traducir: ' + error.message, 'error');
            return text; // Return original text on error
        }
    }

    // You can add more translation providers here (e.g., Google Translate API, DeepL API)
    // Each would have its own method and potentially require API keys.
}

const translator = new Translator(app); // Assuming 'app' is globally available or passed


