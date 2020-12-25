const users = [];

// Join user to  personal chat
function JoinNewUser(SocketID, UserID, Name, Groups) {
   const user = { SocketID, UserID, Name, Groups };
   users.push(user);
   return user;
}

// Get current user
function getCurrentUser(SocketID) {
   return users.find(user => user.SocketID === SocketID);
}

// User leaves chat
function userLeave(SocketID) {
   const index = users.findIndex(user => user.SocketID === SocketID);

   if (index !== -1) {
      return users.splice(index, 1)[0];
   }
}

function userLeaveByUserID(UserID) {
   const index = users.findIndex(user => user.UserID === UserID);

   if (index !== -1) {
      return users.splice(index, 1)[0];
   }
}

function printUsers() {
   console.log(users);
}






// Get room users
function getRoomUsers(RoomID) {
   return users.filter(user => user.RoomID === RoomID);
}


module.exports = {
   JoinNewUser,
   getCurrentUser,
   userLeave,
   getRoomUsers,
   userLeaveByUserID,
   printUsers
};


