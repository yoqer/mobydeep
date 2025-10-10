# Multi-LLM Platform - Static Edition

Una plataforma avanzada para integrar múltiples modelos de lenguaje (LLM) con frontend estático, diseñada para GitHub Pages y uso local.

## 🚀 Características Principales

### 🤖 **Múltiples Proveedores LLM**
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Deepseek**: Deepseek Chat, Deepseek Coder
- **Groq**: Llama 3 8B/70B, Mixtral 8x7B, Gemma 7B
- **Grok (X.AI)**: Grok-1
- **Meta Llama**: Llama 2 7B/13B/70B Chat
- **NVIDIA**: Llama3 ChatQA 8B/70B
- **Cohere**: Command R+, Command R, Command
- **Mistral AI**: Mistral Large/Medium/Small, Open Mixtral 8x7B/8x22B
- **Chat.Z.AI**: Modelo personalizado integrado
- **Kimi.com**: Modelo personalizado integrado

### 🔧 **Funcionalidades Avanzadas**
- **Gestión de Claves API por Modelo**: Configura claves API específicas para cada modelo
- **LLMs Personalizados**: Añade tus propios modelos desde cualquier web
- **Comparación en Tiempo Real**: Ve respuestas de hasta 3 modelos simultáneamente
- **Almacenamiento Local**: IndexedDB + localStorage para persistencia completa
- **Reconocimiento de Voz**: Web Speech API integrada
- **Síntesis de Voz**: Text-to-Speech automático
- **Gestión de Archivos**: Drag & drop y explorador de archivos
- **Traducción**: Sistema de traducción integrado
- **Tema Claro/Oscuro**: Cambio automático según preferencias

### 💾 **Almacenamiento y Persistencia**
- **Conversaciones**: Guardado automático en IndexedDB
- **Configuraciones**: Persistencia de todas las configuraciones
- **Claves API**: Almacenamiento seguro local
- **Modelos Personalizados**: Gestión completa de LLMs custom
- **Exportar/Importar**: Backup completo de datos

## 🌐 **Despliegue**

### GitHub Pages
1. Fork este repositorio
2. Ve a Settings > Pages
3. Selecciona "Deploy from a branch"
4. Elige "main" branch y "/ (root)"
5. ¡Listo! Tu aplicación estará disponible en `https://yoqer.github.io/mobydeep`

### Uso Local
1. Descarga o clona el repositorio
2. Abre `index.html` en tu navegador
3. O usa un servidor local:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

### Otros Hostings
- **Netlify**: Drag & drop de la carpeta
- **Vercel**: Conectar repositorio de GitHub
- **Firebase Hosting**: Deploy con CLI
- **Cualquier hosting estático**: Subir archivos vía FTP

## ⚙️ **Configuración**

### 1. Configurar Claves API
1. Haz clic en el botón de configuración (⚙️)
2. Ve a la pestaña "APIs"
3. Introduce las claves API para los proveedores que desees usar
4. Opcionalmente, configura claves específicas por modelo
5. Prueba las conexiones con el botón "Probar Todas las Conexiones"

### 2. Añadir LLMs Personalizados
1. Ve a la pestaña "LLMs Personalizados" en configuración
2. Rellena el formulario con los datos de tu LLM:
   - **ID Único**: Identificador único (ej: `mi-llm-custom`)
   - **Nombre**: Nombre visible (ej: `Mi LLM Personalizado`)
   - **Proveedor**: Tipo de API (ej: `openai`, `custom`)
   - **URL de API**: Endpoint base (ej: `https://api.mi-llm.com/v1`)
   - **Clave API**: Tu clave de acceso
   - **Configuraciones**: Tokens máximos, ventana de contexto, etc.
3. Haz clic en "Añadir LLM Personalizado"

### 3. Configuración General
- **Ventana de Contexto**: Ajusta el tamaño máximo de contexto
- **Temperatura**: Controla la creatividad de las respuestas
- **Tokens Máximos**: Límite de tokens por respuesta
- **Auto-guardar**: Guardar conversaciones automáticamente
- **Auto-reproducir**: Reproducir respuestas en voz alta

## 🎯 **Uso de la Aplicación**

### Interfaz Principal
- **Ventana Superior**: Respuesta principal consolidada
- **Tres Ventanas Inferiores**: Comparación de respuestas de diferentes modelos
- **Sidebar Izquierdo**: Conversaciones, modelos activos y estadísticas
- **Área de Entrada**: Input de texto con controles de voz y archivos

### Flujo de Trabajo
1. **Selecciona Modelos**: Elige hasta 3 modelos para comparar
2. **Escribe tu Mensaje**: Usa el área de texto o reconocimiento de voz
3. **Envía**: Haz clic en enviar o presiona Enter
4. **Compara Respuestas**: Ve las respuestas de todos los modelos simultáneamente
5. **Gestiona Conversaciones**: Guarda, exporta o continúa conversaciones

### Funciones Avanzadas
- **Reconocimiento de Voz**: Haz clic en el micrófono para dictar
- **Adjuntar Archivos**: Arrastra archivos o usa el botón de adjuntar
- **Copiar Respuestas**: Copia cualquier respuesta al portapapeles
- **Síntesis de Voz**: Escucha las respuestas en voz alta
- **Traducción**: Traduce mensajes entre idiomas

## 🔒 **Privacidad y Seguridad**

- **Datos Locales**: Toda la información se almacena en tu navegador
- **Sin Servidor**: No enviamos datos a servidores externos
- **Claves API Seguras**: Las claves se almacenan localmente y se encriptan
- **Control Total**: Tú controlas todos tus datos y configuraciones

## 🛠️ **Tecnologías Utilizadas**

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Almacenamiento**: IndexedDB, localStorage
- **APIs Web**: Speech Recognition, Speech Synthesis, File API
- **Estilos**: CSS Variables, Flexbox, Grid
- **Iconos**: Font Awesome 6.4.0
- **Fuentes**: Inter (Google Fonts)

## 📱 **Compatibilidad**

- **Navegadores**: Chrome, Firefox, Safari, Edge (versiones modernas)
- **Dispositivos**: Desktop, tablet, móvil (responsive design)
- **Sistemas**: Windows, macOS, Linux, iOS, Android
- **Requisitos**: JavaScript habilitado, almacenamiento local disponible

## 🤝 **Contribuir**

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 **Soporte**

- **Issues**: Reporta bugs o solicita features en GitHub Issues
- **Documentación**: Consulta este README para guías detalladas
- **Comunidad**: Únete a las discusiones en GitHub Discussions

## 🔄 **Actualizaciones**

Para mantener tu instalación actualizada:
1. Haz pull de los últimos cambios del repositorio
2. Refresca tu navegador para cargar los nuevos archivos
3. Revisa el changelog para nuevas funcionalidades

---

**¡Disfruta comparando respuestas de múltiples LLMs en una sola plataforma!** 🚀

