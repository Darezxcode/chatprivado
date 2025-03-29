// client.js
// Cliente de terminal para chat privado encriptado

const io = require('socket.io-client');
const readline = require('readline');
const colors = require('colors/safe');

// Configuración de colores
colors.setTheme({
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  message: 'cyan',
  system: 'grey'
});

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Dirección del servidor
const SERVER_URL = 'http://localhost:3000';

// Conectar al servidor
console.log(colors.info('Conectando al servidor de chat...'));
const socket = io(SERVER_URL);

// Variables globales
let username = '';
let userId = '';
let isConnected = false;

// Limpiar la consola
function clearScreen() {
  console.clear();
}

// Mostrar cabecera
function showHeader() {
  clearScreen();
  console.log(colors.info('======================================'));
  console.log(colors.info('      CHAT PRIVADO ENCRIPTADO        '));
  console.log(colors.info('======================================'));
  console.log('');
}

// Manejar conexión
socket.on('connect', () => {
  showHeader();
  console.log(colors.success('✅ Conectado al servidor'));
  isConnected = true;
  
  // Pedir nombre de usuario
  rl.question(colors.info('Introduce tu nombre de usuario: '), (name) => {
    username = name.trim();
    // Enviar solicitud de registro
    socket.emit('register', username);
  });
});

// Manejar registro exitoso
socket.on('registration_success', (data) => {
  userId = data.userId;
  console.log(colors.success(`\n✅ Bienvenido ${username}!`));
  console.log(colors.info(`Tu ID único: ${userId}`));
  console.log(colors.info('\nInstrucciones:'));
  console.log(colors.info('- Escribe tu mensaje y presiona Enter para enviar'));
  console.log(colors.info('- Escribe "/salir" para desconectar'));
  console.log(colors.info('- Escribe "/usuarios" para ver usuarios conectados'));
  console.log(colors.info('- Escribe "/limpiar" para limpiar la pantalla'));
  console.log('\n');
  
  // Iniciar bucle de mensajes
  promptMessage();
});

// Función para solicitar mensajes
function promptMessage() {
  rl.question('> ', (message) => {
    // Procesar comandos
    if (message.toLowerCase() === '/salir') {
      console.log(colors.warning('Desconectando...'));
      socket.disconnect();
      rl.close();
      return;
    }
    
    if (message.toLowerCase() === '/limpiar') {
      showHeader();
      promptMessage();
      return;
    }
    
    if (message.toLowerCase() === '/usuarios') {
      socket.emit('get_users');
      promptMessage();
      return;
    }
    
    // Enviar mensaje
    if (message.trim() !== '') {
      socket.emit('send_message', { message });
    }
    
    // Continuar bucle
    promptMessage();
  });
}

// Recibir mensaje
socket.on('new_message', (data) => {
  // Verificar si es nuestro propio mensaje
  const isMine = data.senderId === socket.id;
  
  // Formatear mensaje
  const timestamp = new Date(data.timestamp).toLocaleTimeString();
  const prefix = isMine ? colors.green(`[${timestamp}] TÚ:`) : colors.yellow(`[${timestamp}] ${data.sender}:`);
  
  // No podemos desencriptar el mensaje de otros (solo simulación)
  const content = isMine ? 
    colors.green(data.content) : 
    colors.yellow('[Mensaje encriptado]');
  
  // Mostrar mensaje
  console.log(`${prefix} ${content}`);
});

// Usuario se une
socket.on('user_joined', (data) => {
  console.log(colors.system(`\n[SISTEMA] ${data.username} se ha unido al chat`));
  console.log(colors.system(`[SISTEMA] Usuarios activos: ${data.activeUsers.join(', ')}`));
});

// Usuario se va
socket.on('user_left', (data) => {
  console.log(colors.system(`\n[SISTEMA] ${data.username} ha abandonado el chat`));
  console.log(colors.system(`[SISTEMA] Usuarios activos: ${data.activeUsers.join(', ')}`));
});

// Lista de usuarios activos
socket.on('active_users', (data) => {
  console.log(colors.system(`\n[SISTEMA] Usuarios activos (${data.count}):`));
  data.users.forEach((user, index) => {
    console.log(colors.system(`  ${index + 1}. ${user.username}`));
  });
  console.log('');
});

// Manejar errores
socket.on('error', (data) => {
  console.log(colors.error(`\n❌ Error: ${data.message}`));
});

socket.on('connect_error', (error) => {
  console.log(colors.error(`\n❌ Error de conexión: ${error.message}`));
  isConnected = false;
});

socket.on('disconnect', () => {
  console.log(colors.warning('\n🔌 Desconectado del servidor'));
  isConnected = false;
  
  if (rl.listenerCount('line') > 0) {
    rl.close();
  }
});

// Manejar cierre del programa
process.on('SIGINT', () => {
  console.log(colors.warning('\nDesconectando...'));
  socket.disconnect();
  rl.close();
  process.exit(0);
});