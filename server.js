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
const mongoose = require('mongoose');
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
  // for (let index = 0; index < socketsId.length; index++) {
  //   if (socketsId[index] === socket.id) {
  //     sockets.splice(index, 1);

  //     socketsId.splice(socketsId.indexOf(userDetails.socketId), 1);
  //   }
  // }
  // console.log(socketsId);
  // Welcome Current User
  // socket.emit(
  //   'message',
  //   formatMessage(FINAL_NAME, 'Welcome To TECH JD Chat App')
  // );

  // When a frag is createed Again
  socket.on('createdAgain', async (userDetails) => {
    await OnlineUsers.find({})
      .populate('userId', '-password -createdAt -updatedAt -__v')
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

    let user = await OnlineUsers.findOne({ socketId: userDetails.socketId });
    if (user) {
    } else {
      user = OnlineUsers({
        userId: userDetails.id,
        socketId: userDetails.socketId,
      });

      await user.save();

      await OnlineUsers.find({})
        .populate('userId', '-password -createdAt -updatedAt -__v')
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

    // console.log(userDetails);
    // const newUser = userDetails;
    // users.push(userDetails);
  });

  // Runs when client Disconnects
  socket.on('userLeft', async (userDetails) => {
    await OnlineUsers.deleteMany({ socketId: userDetails.socketId });
    // await OnlineUsers.findByIdAndDelete();
    // await OnlineUsers.findOneAndDelete({ socketId: userDetails.socketId });

    // await OnlineUsers.findByIdAndDelete(userDetails.id);

    await OnlineUsers.find({})
      .populate('userId', '-password -createdAt -updatedAt -__v')
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
    //     io.emit('users', users);
    //     console.log(users);
    //   }
    // });

    // console.log(`${userDetails.name} has left the chat `);
    // console.log(`${userDetails.socketId} has left the chat `); // io.emit(
    // //   'message',
    // //   formatMessage(FINAL_NAME, `${username} has left the chat`)
    // // );

    // io.emit('users', users);
  });

  // Emit All Chat Messages when User Navigates to Chat Activity
  socket.on('navigate', async (userDet) => {
    /*
    from -> userDet.from
    to -> userDet.to
    */
    console.log('Called Navigate');
    console.log(userDet);
    await Messages.aggregate([
      {
        $lookup: {
          from: 'chatusers',
          localField: 'to',
          foreignField: '_id',
          as: 'toObj',
        },
      },
      {
        $lookup: {
          from: 'chatusers',
          localField: 'from',
          foreignField: '_id',
          as: 'fromObj',
        },
      },
    ])
      .match({
        $or: [
          {
            $and: [
              { to: mongoose.Types.ObjectId(userDet.to) },
              { from: mongoose.Types.ObjectId(userDet.from) },
            ],
          },
          {
            $and: [
              { to: mongoose.Types.ObjectId(userDet.from) },
              { from: mongoose.Types.ObjectId(userDet.to) },
            ],
          },
        ],
      })
      .project({
        'toObj.password': 0,
        'toObj.__v': 0,
        'fromObj.password': 0,
        'fromObj.__v': 0,
      })
      .exec((err, msgs) => {
        if (err) {
        } else {
          socket.emit('message', msgs);
        }
      });
    // let messages = await Messages.find({
    //   $or: [
    //     {
    //       $or: [{ from: userDet.from }, { to: userDet.to }],
    //     },
    //     {
    //       $or: [{ to: userDet.from }, { from: userDet.to }],
    //     },
    //   ],
    // })
    //   .populate('from', '-password -createdAt -updatedAt -__v')
    //   .populate('to', '-password -createdAt -updatedAt -__v')
    //   .exec((err, msgs) => {
    //     if (err) {
    //     } else {
    //       if (msgs.length == 0) {
    //       } else {
    //         console.log(msgs);
    //         socket.emit('message', msgs);
    //       }
    //       // console.log(msgs);
    //     }
    //   });

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
      // console.log(newMessage);

      await Messages.aggregate([
        {
          $lookup: {
            from: 'chatusers',
            localField: 'to',
            foreignField: '_id',
            as: 'toObj',
          },
        },
        {
          $lookup: {
            from: 'chatusers',
            localField: 'from',
            foreignField: '_id',
            as: 'fromObj',
          },
        },
      ])
        .match({
          _id: mongoose.Types.ObjectId(newMessage._id),
        })
        .project({
          'toObj.password': 0,
          'toObj.__v': 0,
          'fromObj.password': 0,
          'fromObj.__v': 0,
        })
        .exec((err, msg) => {
          if (err) {
          } else {
            io.to(user.socketId).emit('message', msg[0]);

            // res.json(user);
          }
        });

      // let Message = Messages.findById(newMessage._id)
      //   .populate('from', '-password -createdAt -updatedAt -__v')
      //   .populate('to', '-password -createdAt -updatedAt -__v')
      //   .exec((err, msg) => {
      //     if (err) {
      //     } else {
      //       io.to(user.socketId).emit('message', msg);
      //       // res.json(msgs);
      //       // console.log(msgs);
      //     }
      //   });
    } else {
      let newMessage = new Messages({
        from: msg.from,
        to: msg.too,
        body: msg.text,
      });

      await newMessage.save();

      await Messages.aggregate([
        {
          $lookup: {
            from: 'chatusers',
            localField: 'to',
            foreignField: '_id',
            as: 'toObj',
          },
        },
        {
          $lookup: {
            from: 'chatusers',
            localField: 'from',
            foreignField: '_id',
            as: 'fromObj',
          },
        },
      ])
        .match({
          _id: mongoose.Types.ObjectId(newMessage._id),
        })
        .project({
          'toObj.password': 0,
          'toObj.__v': 0,
          'fromObj.password': 0,
          'fromObj.__v': 0,
        })
        .exec((err, msg) => {
          if (err) {
          } else {
            io.to(user.socketId).emit('message', msg[0]);

            // res.json(user);
          }
        });

      // let Message = Messages.findById(newMessage._id)
      //   .populate('from', '-password -createdAt -updatedAt -__v')
      //   .populate('to', '-password -createdAt -updatedAt -__v')
      //   .exec((err, msg) => {
      //     if (err) {
      //     } else {
      //       io.to(user.socketId).emit('message', msg);
      //       // res.json(msgs);
      //       // console.log(msgs);
      //     }
      //   });
      // console.log(newMessage);
      // socket.emit('message', newMessage);
    }

    // socket.broadcast.emit('message', formatMessage(msg.name, msg.message));
  });
});

app.use('/api/v1/user', usersR);

app.get('/user', async (req, res) => {
  await OnlineUsers.findById('6096e90c6c8bb300f4398bb4')
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

app.get('/getChatUsers', async (req, res) => {
  let user = await Users.find()
    .select('-password')
    .exec((err, users) => {
      if (err) {
      } else {
        res.json(users);
      }
    });
});

app.get('/test', async (req, res) => {
  // https://proandroiddev.com/how-to-draw-a-custom-view-9da8016fe94#:~:text=How%20to%20draw%20a%20circle,the%20height%20of%20the%20bar.
  // Working
  // let messages = await Messages.find({
  //   $or: [
  //     { from: '6079e797aab61332405cd40b' },
  //     { to: '607a7ace8830e818306f4bc4' },
  //   ],
  // });
  // await Messages.aggregate([
  //   {
  //     $match: {
  //       $or: [
  //         {
  //           $or: [
  //             { from: '60978d609855dc1e8cd18883' },
  //             { to: '60978dad9855dc1e8cd18885' },
  //           ],
  //         },
  //         {
  //           $or: [
  //             { to: '60978dad9855dc1e8cd18885' },
  //             { from: '60978d609855dc1e8cd18883' },
  //           ],
  //         },
  //       ],
  //     },
  //   },
  // ]).exec((err, msgs) => {
  //   if (err) {
  //   } else {
  //     res.json(msgs);
  //     // console.log(msgs);
  //   }
  // });
  await Messages.aggregate([
    {
      $lookup: {
        from: 'chatusers',
        localField: 'to',
        foreignField: '_id',
        as: 'toObj',
      },
    },
    {
      $lookup: {
        from: 'chatusers',
        localField: 'from',
        foreignField: '_id',
        as: 'fromObj',
      },
    },
  ])
    .match({
      $or: [
        {
          $and: [
            { to: mongoose.Types.ObjectId('60978dad9855dc1e8cd18885') },
            { from: mongoose.Types.ObjectId('6097c6702466a20538e28826') },
          ],
        },
        {
          $and: [
            { to: mongoose.Types.ObjectId('6097c6702466a20538e28826') },
            { from: mongoose.Types.ObjectId('60978dad9855dc1e8cd18885') },
          ],
        },
      ],
    })
    .project({
      'toObj.password': 0,
      'toObj.__v': 0,
      'fromObj.password': 0,
      'fromObj.__v': 0,
    })
    .exec((err, msgs) => {
      if (err) {
      } else {
        res.json(msgs);
      }
    });

  // { $and: [{ to: user1 }, { from: user2 }] },
  // { $and: [{ to: user2 }, { from: user1 }] },
  // let messages = await Messages.find({})
  //   .populate('from', '-password -createdAt -updatedAt -__v')
  //   .populate('to', '-password -createdAt -updatedAt -__v')
  //   .exec((err, msgs) => {
  //     if (err) {
  //     } else {
  //       res.json(msgs);
  //       // console.log(msgs);
  //     }
  //   });

  /*


         $or: [
          { from: '60978d609855dc1e8cd18883' },
          { to: '6097c6702466a20538e28826' },
        ],

  let messages = await Messages.find({
    $or: [
      {
        $or: [
          { from: '60978d609855dc1e8cd18883' },
          { to: '6097c6702466a20538e28826' },
        ],
      },
      // {
      //   $or: [
      //     { to: '60978dad9855dc1e8cd18885' },
      //     { from: '60978d609855dc1e8cd18883' },
      //   ],
      // },
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
    */

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

app.get('/singleMessage', async (req, res) => {
  await Messages.aggregate([
    {
      $lookup: {
        from: 'chatusers',
        localField: 'to',
        foreignField: '_id',
        as: 'toObj',
      },
    },
    {
      $lookup: {
        from: 'chatusers',
        localField: 'from',
        foreignField: '_id',
        as: 'fromObj',
      },
    },
  ])
    .match({
      _id: mongoose.Types.ObjectId('60978def9855dc1e8cd18887'),
    })
    .project({
      'toObj.password': 0,
      'toObj.__v': 0,
      'fromObj.password': 0,
      'fromObj.__v': 0,
    })
    .exec((err, user) => {
      if (err) {
      } else {
        // console.log(user[0]);
        res.json(user[0]);
      }
    });
});

app.get('/getSingle', async (req, res) => {
  let Message = Messages.findById('6096da9f6c8bb300f4398b97')
    .populate('from', '-password -createdAt -updatedAt -__v')
    .populate('to', '-password -createdAt -updatedAt -__v')
    .exec((err, msg) => {
      if (err) {
      } else {
        // io.to(user.socketId).emit('message', msg);
        res.json(msg);
        // console.log(msgs);
      }
    });
});
httpServer.listen(PORT_NO, () => {
  console.log(`Server is Running on ${PORT_NO}`);
});
