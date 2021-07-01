const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {debug: true});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

var users=[];
var usersdict=new Map()
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId);
        
        socket.on('message', (message,username) => {
            io.to(roomId).emit('createMessage', message,username)
        }); 

        socket.on('add-Username',username=>{
            console.log("reached to server.js",username)
            if(usersdict.has(roomId)){
                console.log("old user")
                users=usersdict.get(roomId)
                users.push(username)
            }
            else{
                console.log("new user");
                users=[username]
            }
            usersdict.set(roomId, users);
            console.log(users)
            io.to(roomId).emit('userlist',users);
        })

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })

    })
})

server.listen(process.env.PORT||3030)
