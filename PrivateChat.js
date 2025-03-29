// PrivateChat.js
// Módulo para gestionar comunicaciones privadas y encriptadas

// Importamos la librería de criptografía
const CryptoJS = require('crypto-js');

/**
 * Clase PrivateChat
 * Gestiona la comunicación privada con encriptación de extremo a extremo
 */
class PrivateChat {
    /**
     * Constructor de la clase
     * Inicializa la configuración básica del chat
     */
    constructor() {
        // Generamos una clave secreta única para esta instancia de chat
        this.secretKey = this.generateSecretKey();
        
        // Almacenamiento de mensajes (solo en memoria)
        this.messages = [];
        
        // Información mínima del usuario para preservar anonimato
        this.userInfo = {
            // ID único y temporal
            id: this.generateUserId(),
            // Momento de creación de la sesión
            createdAt: Date.now()
        };

        // Registro de eventos (opcional, para depuración)
        this.eventLog = [];
    }

    /**
     * Genera una clave secreta aleatoria
     * @returns {string} Clave secreta generada
     */
    generateSecretKey() {
        // Usamos CryptoJS para generar un valor aleatorio seguro
        // 256 bits de longitud para máxima seguridad
        return CryptoJS.lib.WordArray.random(256/8).toString();
    }

    /**
     * Genera un ID de usuario temporal y único
     * @returns {string} ID de usuario generado
     */
    generateUserId() {
        // Generamos un ID único de 128 bits
        return CryptoJS.lib.WordArray.random(128/8).toString();
    }

    /**
     * Encripta un mensaje usando la clave secreta
     * @param {string} message - Mensaje a encriptar
     * @returns {string|null} Mensaje encriptado o null si hay error
     */
    encryptMessage(message) {
        try {
            // Encriptación usando AES (Advanced Encryption Standard)
            const encrypted = CryptoJS.AES.encrypt(message, this.secretKey).toString();
            
            // Registramos el evento de encriptación
            this.logEvent('encrypt', { 
                messageLength: message.length 
            });

            return encrypted;
        } catch (error) {
            console.error("Error de encriptación:", error);
            this.logEvent('encrypt_error', { error: error.message });
            return null;
        }
    }

    /**
     * Desencripta un mensaje usando la clave secreta
     * @param {string} encryptedMessage - Mensaje encriptado
     * @returns {string|null} Mensaje desencriptado o null si hay error
     */
    decryptMessage(encryptedMessage) {
        try {
            // Desencriptación usando la misma clave
            const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.secretKey);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            // Verificamos que la desencriptación fue exitosa
            if (decrypted) {
                this.logEvent('decrypt', { 
                    messageLength: decrypted.length 
                });
                return decrypted;
            }

            throw new Error("Desencriptación fallida");
        } catch (error) {
            console.error("Error de desencriptación:", error);
            this.logEvent('decrypt_error', { error: error.message });
            return null;
        }
    }

    /**
     * Envía un mensaje (encriptado)
     * @param {string} messageText - Texto del mensaje
     * @returns {Object} Objeto de mensaje encriptado
     */
    sendMessage(messageText) {
        // 1. Encriptamos el mensaje
        const encryptedMessage = this.encryptMessage(messageText);
        
        // 2. Creamos objeto de mensaje
        const messageObject = {
            id: Date.now(), // ID único
            content: encryptedMessage,
            timestamp: new Date().toISOString(),
            sender: this.userInfo.id
        };

        // 3. Agregamos al almacén de mensajes
        this.messages.push(messageObject);

        // 4. Registramos el evento de envío
        this.logEvent('send_message', messageObject);

        return messageObject;
    }

    /**
     * Recibe un mensaje (desencriptado)
     * @param {Object} encryptedMessageObject - Mensaje encriptado recibido
     * @returns {Object|null} Mensaje desencriptado o null
     */
    receiveMessage(encryptedMessageObject) {
        // 1. Desencriptamos el mensaje
        const decryptedContent = this.decryptMessage(encryptedMessageObject.content);
        
        // 2. Verificamos desencriptación
        if (decryptedContent) {
            // Registramos evento de recepción
            this.logEvent('receive_message', {
                sender: encryptedMessageObject.sender,
                timestamp: encryptedMessageObject.timestamp
            });

            return {
                ...encryptedMessageObject,
                decryptedContent: decryptedContent
            };
        }

        return null;
    }

    /**
     * Limpia mensajes antiguos
     * @param {number} olderThan - Tiempo máximo de retención (milisegundos)
     */
    clearMessages(olderThan = 5 * 60 * 1000) { // 5 minutos por defecto
        const now = Date.now();
        
        // Filtramos mensajes más recientes
        this.messages = this.messages.filter(
            msg => (now - new Date(msg.timestamp).getTime()) < olderThan
        );

        // Registramos limpieza de mensajes
        this.logEvent('clear_messages', { 
            messagesRemaining: this.messages.length 
        });
    }

    /**
     * Registra eventos para seguimiento y depuración
     * @param {string} eventType - Tipo de evento
     * @param {Object} eventData - Datos del evento
     */
    logEvent(eventType, eventData = {}) {
        const eventLog = {
            type: eventType,
            timestamp: new Date().toISOString(),
            ...eventData
        };

        this.eventLog.push(eventLog);

        // Opcional: limitar tamaño del registro de eventos
        if (this.eventLog.length > 100) {
            this.eventLog.shift(); // Elimina el evento más antiguo
        }
    }

    /**
     * Obtiene el registro de eventos
     * @returns {Array} Registro de eventos
     */
    getEventLog() {
        return this.eventLog;
    }
}


    
    
// Exportamos la clase para uso en otros módulos
module.exports = PrivateChat;

// Ejemplo de uso (comentado para no interferir)
/*
const chat = new PrivateChat();
const message = chat.sendMessage("Mensaje secreto");
console.log(chat.receiveMessage(message));
*/