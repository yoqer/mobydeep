class AudioManager {
    constructor(app) {
        this.app = app;
        this.speechSynthesis = window.speechSynthesis;
        this.speechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = null;
        this.isListening = false;
        this.voices = [];

        this.loadVoices();
        this.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }

    loadVoices() {
        this.voices = this.speechSynthesis.getVoices();
    }

    speak(text, lang = 'es-ES') {
        if (!this.speechSynthesis || !text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Try to find a Spanish voice, otherwise use default
        const spanishVoice = this.voices.find(voice => voice.lang === 'es-ES' || voice.lang === 'es_ES');
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }

        utterance.onend = () => {
            // console.log('Speech ended');
        };
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            this.app.showNotification('Error al reproducir audio: ' + event.error, 'error');
        };

        this.speechSynthesis.speak(utterance);
    }

    startListening(lang = 'es-ES') {
        if (!this.speechRecognition) {
            this.app.showNotification('El reconocimiento de voz no es compatible con este navegador.', 'error');
            return;
        }

        if (this.recognition) {
            this.recognition.stop();
        }

        this.recognition = new this.speechRecognition();
        this.recognition.lang = lang;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.app.elements.voiceInput.classList.add('active');
            this.app.showNotification('Escuchando...', 'info');
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.app.elements.messageInput.value = transcript;
            this.app.updateInputStats();
            this.app.showNotification('Texto reconocido: ' + transcript, 'success');
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.app.elements.voiceInput.classList.remove('active');
            console.error('SpeechRecognition error:', event.error);
            if (event.error !== 'no-speech') {
                this.app.showNotification('Error en reconocimiento de voz: ' + event.error, 'error');
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.app.elements.voiceInput.classList.remove('active');
            this.app.showNotification('Reconocimiento de voz finalizado.', 'info');
        };

        this.recognition.start();
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.app.elements.voiceInput.classList.remove('active');
            this.app.showNotification('Reconocimiento de voz detenido.', 'info');
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
}


