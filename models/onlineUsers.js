const mongoose = require('mongoose');

const onlineUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chatusers',
    },
    socketId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const OnlineUsers = mongoose.model('onlineUsers', onlineUserSchema);
module.exports = OnlineUsers;
