const moment = require('moment');
 
function parseMessage(SenderID, SenderName, ReceiverID, ChatType, MessageText, Attachment, ContentType, MessageType) {
  return {
      SenderID,
      SenderName,
      ReceiverID,
      ChatType, //i.e.: G ='GROUP CHAT', P = 'PERSONAL CHAT' 
      MessageText,
      Attachment,
      ContentType, // i.e.: TXT, IMG, VIDEO, etc
      MessageType, // MSG, Notification, etc.
      CreatedOn: moment().format('h:mm a')
  };
}

function validateMessage(message) {
   return message.SenderID > 0 && message.ReceiverID > 0 && (message.ChatType == 'P' || message.ChatType == 'G');
}
  
  
module.exports = {
   validateMessage,
   parseMessage
}
