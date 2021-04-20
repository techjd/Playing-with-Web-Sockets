const mongoose = require('mongoose');

const messagesSchema = mongoose.Schema(
  {
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chatusers',
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chatusers',
    },
    body: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// messagesSchema.virtual('fromUser', {
//   ref: 'chatusers',
//   localField: 'from',
//   foreignField: '_id',
// });

// messagesSchema.virtual('toUser', {
//   ref: 'chatusers',
//   localField: 'to',
//   foreignField: '_id',
// });

const Messages = mongoose.model('messages', messagesSchema);
module.exports = Messages;
