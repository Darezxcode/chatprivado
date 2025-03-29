// server.js
// Servidor WebSocket para chat privado encriptado

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const PrivateChat = require('./PrivateChat');
const path = require('path');

// Configuración de Express
const app = express();
const server = http.createServer(app);

// Servir archivos estáticos si es necesario
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, restringir a dominios específicos
    methods: ["GET", "POST"]
  }
});

// Almacenamiento de usuarios conectados
const connectedUsers = new Map();

// Registro de actividad en consola
console.log("🔐 Iniciando servidor de chat privado encriptado...");

// Gestión de conexiones de WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Nueva conexión: ${socket.id}`);

  // Registro de usuario
  socket.on('register', (username) => {
    // Verificación de nombre de usuario
    if (!username || username.trim() === '') {
      socket.emit('error', { message: 'Nombre de usuario inválido' });
      return;
    }

    // Creamos instancia de chat para este usuario
    const userChat = new PrivateChat();
    
    // Almacenamos información del usuario
    connectedUsers.set(socket.id, {
      username: username.trim(),
      chat: userChat,
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Notificamos éxito al usuario
    socket.emit('registration_success', {
      userId: userChat.userInfo.id,
      timestamp: new Date().toISOString()
    });

    // Notificamos a todos los usuarios
    io.emit('user_joined', {
      username: username.trim(),
      timestamp: new Date().toISOString(),
      activeUsers: Array.from(connectedUsers.values()).map(user => user.username)
    });

    console.log(`👤 Usuario registrado: ${username} (${socket.id})`);
  });

  // Envío de mensaje privado
  socket.on('send_message', (data) => {
    const sender = connectedUsers.get(socket.id);
    
    if (!sender) {
      socket.emit('error', { message: 'No estás registrado' });
      return;
    }

    // Verificamos que el mensaje no esté vacío
    if (!data.message || data.message.trim() === '') {
      socket.emit('error', { message: 'Mensaje vacío' });
      return;
    }

    // Encriptamos el mensaje con nuestra clase PrivateChat
    const encryptedMessage = sender.chat.encryptMessage(data.message);
    
    // Creamos objeto de mensaje
    const messageObject = {
      id: Date.now(),
      sender: sender.username,
      senderId: socket.id,
      content: encryptedMessage,
      timestamp: new Date().toISOString()
    };

    // Emitimos a todos los usuarios (en un chat privado real se enviaría solo al destinatario)
    io.emit('new_message', messageObject);
    
    console.log(`📨 Mensaje de ${sender.username}: [encriptado]`);
  });

  // Desconexión de usuario
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    
    if (user) {
      io.emit('user_left', {
        username: user.username,
        timestamp: new Date().toISOString(),
        activeUsers: Array.from(connectedUsers.values())
          .filter(u => u.socketId !== socket.id)
          .map(u => u.username)
      });
      
      console.log(`👋 Usuario desconectado: ${user.username} (${socket.id})`);
    } else {
      console.log(`👋 Conexión cerrada: ${socket.id}`);
    }
    
    // Eliminamos usuario
    connectedUsers.delete(socket.id);
  });

  // Control de errores
  socket.on('error', (error) => {
    console.error(`❌ Error en socket ${socket.id}:`, error);
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Iniciamos servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`⏰ ${new Date().toLocaleString()}`);
});