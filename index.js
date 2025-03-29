// index.js
// Punto de entrada para probar nuestro sistema de chat privado

// Importamos nuestra clase PrivateChat
const PrivateChat = require('./PrivateChat');

// Función principal para demostrar funcionalidades
function demoPrivateChat() {
    // Creamos dos instancias de chat simulando dos usuarios
    const chat1 = new PrivateChat();
    const chat2 = new PrivateChat();

    console.log("🔐 Información de Usuarios:");
    console.log("Usuario 1 ID:", chat1.userInfo.id);
    console.log("Usuario 2 ID:", chat2.userInfo.id);

    // Enviamos un mensaje desde chat1 a chat2
    console.log("\n Enviando mensaje encriptado...");
    const sentMessage = chat1.sendMessage("Hola, este es un mensaje secreto");
    
    // Recibimos el mensaje en chat2
    const receivedMessage = chat2.receiveMessage(sentMessage);

    // Mostramos detalles del mensaje
    console.log("\n📨 Detalles del Mensaje:");
    console.log("Mensaje Original Encriptado:", sentMessage.content);
    console.log("Mensaje Desencriptado:", receivedMessage.decryptedContent);

    // Probamos autoborrado de mensajes
    console.log("\n Limpiando mensajes antiguos...");
    chat1.clearMessages(1000); // Borrar mensajes más antiguos de 1 segundo
    console.log("Mensajes restantes:", chat1.messages.length);

    // Mostramos registro de eventos
    console.log("\n📋 Registro de Eventos:");
    console.log(chat1.getEventLog());
}

// Ejecutamos la demostración
demoPrivateChat();