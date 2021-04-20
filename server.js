const app = require('express')();
const bodyParser = require('body-parser');
const connectDB = require('./utils/db');
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const PORT_NO = 3000;
const formatMessage = require('./utils/messages');
const usersR = require('./routes/userRoutes');
const Conversations = require('./models/conversations');
const Messages = require('./models/messages');
const OnlineUsers = require('./models/onlineUsers');
const Users = require('./models/users');
const FINAL_NAME = 'BOT';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

let socketsId = [];
let users = [];

io.on('connection', (socket) => {
  console.log('New WS Connection');
  console.log(socket.id);
  socketsId.push(socket.id);

  socket.emit('id', socket.id);

  // console.log(socketsId);
  // Welcome Current User
  socket.emit(
    'message',
    formatMessage(FINAL_NAME, 'Welcome To TECH JD Chat App')
  );

  // When a frag is createed Again
  socket.on('createdAgain', async (userDetails) => {
    await OnlineUsers.find({})
      .populate('chatusers')
      .exec((err, users) => {
        if (err) {
        } else {
          // socket.broadcast.emit('users', users);
          io.to(userDetails.id).emit('users', users);
          // console.log(users);
        }
      });
  });

  // BroadCast When A User Connects
  socket.on('userJoined', async (userDetails) => {
    console.log('user Joined Called');
    // console.log(userDetails);
    // const newUser = userDetails;
    // users.push(userDetails);
    let user = await OnlineUsers.findOne({ socketId: userDetails.socketId });
    if (user) {
    } else {
      user = OnlineUsers({
        userId: userDetails.id,
        socketId: userDetails.socketId,
      });

      await user.save();

      await OnlineUsers.find({})
        .populate('chatusers')
        .exec((err, users) => {
          if (err) {
          } else {
            // socket.broadcast.emit('users', users);
            io.emit('users', users);

            // console.log(users);
          }
        });
      // await OnlineUsers.find({}, (err, users) => {
      //   if (err) {
      //   } else {
      //     // socket.broadcast.emit('users', users);
      //     io.emit('users', users);
      //     console.log(users);
      //   }
      // });
    }
  });

  // Runs when client Disconnects
  socket.on('userLeft', async (userDetails) => {
    await OnlineUsers.findOneAndDelete({ socketId: userDetails.socketId });

    // await OnlineUsers.findByIdAndDelete(userDetails.id);

    await OnlineUsers.find({}, (err, users) => {
      if (err) {
      } else {
        io.emit('users', users);
        console.log(users);
      }
    });

    // console.log(`${userDetails.name} has left the chat `);
    // console.log(`${userDetails.socketId} has left the chat `); // io.emit(
    // //   'message',
    // //   formatMessage(FINAL_NAME, `${username} has left the chat`)
    // // );
    // for (let index = 0; index < users.length; index++) {
    //   if (users[index].socketId === userDetails.socketId) {
    //     users.splice(index, 1);
    //     socketsId.splice(socketsId.indexOf(userDetails.socketId), 1);
    //   }
    // }
    // io.emit('users', users);
  });

  // Emit All Chat Messages when User Navigates to Chat Activity
  socket.on('navigate', async (userDet) => {
    console.log('Called Navigate');
    console.log(userDet);
    let messages = await Messages.find({
      $or: [
        {
          $or: [{ from: userDet.from }, { to: userDet.to }],
        },
        {
          $or: [{ to: userDet.from }, { from: userDet.to }],
        },
      ],
    });

    if (messages.length == 0) {
    } else {
      console.log(messages);
      socket.emit('message', messages);
    }

    // io.to(msg.to).emit('message', formatMessage(msg.name, msg.message));
  });

  // Listen For Chat Message
  socket.on('chatMessage', async (msg) => {
    // console.log(msg.to);

    // let findUser = await Users.findById(msg.to);

    // console.log('I found ');
    // console.log(findUser);
    let user = await OnlineUsers.findById(msg.to);

    console.log('User isssss');
    console.log(user);
    if (user) {
      let newMessage = new Messages({
        from: msg.from,
        to: msg.too,
        body: msg.text,
      });

      await newMessage.save();
      console.log(newMessage);

      io.to(user.socketId).emit('message', newMessage);
    } else {
      let newMessage = new Messages({
        from: msg.from,
        to: msg.too,
        body: msg.text,
      });

      await newMessage.save();

      console.log(newMessage);
      socket.emit('message', newMessage);
    }

    // socket.broadcast.emit('message', formatMessage(msg.name, msg.message));
  });
});

app.use('/api/v1/user', usersR);

app.get('/user', async (req, res) => {
  await OnlineUsers.findById('607c471d70a4af18f47bc0b2')
    .populate('userId', '-password -createdAt -updatedAt -__v')
    .exec((err, user) => {
      res.json(user);
    });
});

app.get('/single', async (req, res) => {
  let msg = Messages.findById('607c3fd422e3a627646c0d00')
    .populate('from', '-password -createdAt -updatedAt -__v')
    .populate('to', '-password -createdAt -updatedAt -__v')
    .exec((err, msg) => {
      res.json(msg);
    });
});

app.get('/test', async (req, res) => {
  // Working
  // let messages = await Messages.find({
  //   $or: [
  //     { from: '6079e797aab61332405cd40b' },
  //     { to: '607a7ace8830e818306f4bc4' },
  //   ],
  // });

  let messages = await Messages.find({
    $or: [
      {
        $or: [
          { from: '6079e797aab61332405cd40b' },
          { to: '607a7ace8830e818306f4bc4' },
        ],
      },
      {
        $or: [
          { to: '6079e797aab61332405cd40b' },
          { from: '607a7ace8830e818306f4bc4' },
        ],
      },
    ],
  })
    .populate('from', '-password -createdAt -updatedAt -__v')
    .populate('to', '-password -createdAt -updatedAt -__v')
    .exec((err, msgs) => {
      if (err) {
      } else {
        res.json(msgs);
        // console.log(msgs);
      }
    });

  // let messages = await Messages.aggregate([
  //   {
  //     $or: [
  //       {
  //         $and: [
  //           { from: '6079e797aab61332405cd40b' },
  //           { to: '607ae1ffc69b571ca00fe9f4' },
  //         ],
  //       },
  //       {
  //         $and: [
  //           { from: '607ae1ffc69b571ca00fe9f4' },
  //           { to: '6079e797aab61332405cd40b' },
  //         ],
  //       },
  //     ],
  //   },
  // ]);

  // let messages = await Messages.find({
  //   $and: [
  //     { from: '6079e797aab61332405cd40b' },
  //     { to: '607ae1ffc69b571ca00fe9f4' },
  //   ],
  // });
  // console.log(messages);

  // const id = '607acf2d711dc13980480aa0';
  // let findUser = await Users.findById(id);

  // console.log('I found ');
  // console.log(findUser);
});

httpServer.listen(PORT_NO, () => {
  console.log(`Server is Running on ${PORT_NO}`);
});
