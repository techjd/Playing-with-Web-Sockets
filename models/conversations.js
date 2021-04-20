const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    lastMessage: {
      type: String,
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chatusers',
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chatusers',
    },
  },
  {
    timestamps: true,
  }
);

const Conversations = mongoose.model('conversations', conversationSchema);
module.exports = Conversations;
