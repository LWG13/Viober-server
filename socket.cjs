const { Server } = require('socket.io');
const express = require("express")
const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = app.listen(PORT, () => {
  console.log(`API server listening at ${PORT}`);
});

const io = new Server(httpServer, {
  cors: {
    origin: "https://a7967ab8-1bb8-4301-b7e9-ac474e9dda2a-00-16da4blhmya43.pike.replit.dev",
    methods: ["GET", "POST", "PUT"],
    transports: ["websocket"],
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
