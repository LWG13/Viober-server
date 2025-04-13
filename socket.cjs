const { Server } = require('socket.io');
const express = require("express")
const app = express();

const server = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  }
});
io.on('connection', socket => {
  console.log('User connected:', socket.id);
 
  socket.onAny((event, ...args) => {
    console.log(`Received event: ${event}`, args);
  });

  socket.on('sendMessage', message => {
    console.log("sendMessage:", message);
    io.emit('newMessage', message);
  });

  
  socket.on('editMessage', updated => {
    io.emit('messageEdited', updated);
  });

  socket.on('deleteMessage', id => {
    io.emit('messageDeleted', id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
})
