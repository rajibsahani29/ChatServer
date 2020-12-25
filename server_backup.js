const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
   userJoin,
   getCurrentUser,
   userLeave,
   getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Access the virtualDirPath appSettings and give it a default value of '/'
// in the event that it doesn't exist or isn't set
var virtualDirPath = process.env.virtualDirPath || '/';

// We also want to make sure that our virtualDirPath 
// always starts with a forward slash
if (!virtualDirPath.startsWith('/', 0))
   virtualDirPath = '/' + virtualDirPath;

// Public Directory
app.use(express.static(path.join(virtualDirPath, 'public')));
// Bower
app.use('/bower_components', express.static(path.join(virtualDirPath, 'bower_components')));



app.get(virtualDirPath, function (req, res) {
   res.json(true);
});

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
   socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      // Welcome current user
      socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

      // Broadcast when a user connects
      socket.broadcast
         .to(user.room)
         .emit(
            'message',
            formatMessage(botName, `${user.username} has joined the chat`)
         );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
         room: user.room,
         users: getRoomUsers(user.room)
      });
   });

   // Listen for chatMessage
   socket.on('chatMessage', msg => {
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit('message', formatMessage(user.username, msg));
   });


   //listen on typing
   socket.on('typing', () => {
      const user = getCurrentUser(socket.id);
      socket.broadcast.emit('typing', { username: user.username })
   })


   // Runs when client disconnects
   socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
         io.to(user.room).emit(
            'message',
            formatMessage(botName, `${user.username} has left the chat`)
         );

         // Send users and room info
         io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
         });
      }
   });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
