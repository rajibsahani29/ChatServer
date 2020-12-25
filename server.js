const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { parseMessage, validateMessage } = require('./utils/messages');
const {
   JoinNewUser,
   getCurrentUser,
   userLeave,
   userLeaveByUserID,
   printUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
   cors: {
      //origin: "https://example.com",
      origin: "*",
      methods: ["GET", "POST"]
   }
});

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
   //res.json(true);
   res.send("It works!");
});

const botName = 'My Chat Bot';

// Run when client connects
io.on('connection', socket => {
   socket.on('joinChatServer', ({ UserID, Name, arrGroups }, response) => {
      console.log('joinChatServer: ' + UserID);
      const user = JoinNewUser(socket.id, UserID, Name, arrGroups);

      userLeaveByUserID(user.UserID);
      socket.join('P_' + user.UserID);
      for (let i = 0; i < arrGroups.length; i++) {
         socket.join('G_' + arrGroups[i]);
      }

      if (typeof response != "undefined") {
         response({ status: 'success' });
      }
      // Welcome current user
      //socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
   });

   // Listen for chatMessage
   socket.on('sendMessage', (message, response) => {
      //message Format = {SenderID, ReceiverID, ChatType,MessageText, Attachment, ContentType, MessageType}

      //console.log('chatMessage: ' + JSON.stringify(message));
      if (!validateMessage(message)) {
         if (typeof response != "undefined") {
            response({ status: 'error', message: 'Invalid Request' });
         }
         return;
      }
      console.log('chatMessage: ' + JSON.stringify(message));
      message = parseMessage(
         message.SenderID,
         message.SenderName,
         message.ReceiverID,
         message.ChatType,
         message.MessageText,
         message.Attachment,
         message.ContentType,
         'CHAT-MSG');
      const user = getCurrentUser(socket.id);

      if (message.ChatType == 'P') {
         socket.to('P_' + message.ReceiverID).emit('receiveMessage', message);
      }
      else if (message.ChatType == 'G') {
         socket.to('G_' + message.ReceiverID).emit('receiveMessage', message);
      }

      if (typeof response != "undefined") {
         response({ status: 'success' });
      }
   });

   //listen on typing
   socket.on('typing', ({ SenderID, SenderName, ReceiverID, ChatType }) => {
      const user = getCurrentUser(socket.id);
      console.log('typing ReceiverID: ' + ReceiverID)
      //console.log('typing ReceiverID: ', { SenderID, SenderName, ReceiverID, ChatType })

      if (ChatType == 'P') {
         socket.to('P_' + ReceiverID).volatile.emit('typing', { SenderID, SenderName, ReceiverID, ChatType });
      }
      else if (ChatType == 'G') {
         socket.to('G_' + ReceiverID).volatile.emit('typing', { SenderID, SenderName, ReceiverID, ChatType });
      }
      //printUsers();
      //socket.broadcast.to('P_' + ReceiverID).emit('typing', { name: SenderName })
   })


   // Runs when client disconnects
   socket.on('disconnect', () => {
      const user = userLeave(socket.id);
      console.log('User disconnect, UID= ' + JSON.stringify(user));
      if (user) {
         //socket.to(user.RoomID).emit('message', formatMessage(botName, `${user.username} has left the chat`));

         // Send users and room info
         //socket.to(user.room).emit('roomUsers', { room: user.room, users: getRoomUsers(user.room) });
      }
   });
});




const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
