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

app.get('/:meet', (req, res) => {
    res.render('meet', { roomId: req.params.meet })
})

app.get('/:room/bye',(req,res)=>{
    res.render('bye')
})


var users=[];
var usersdict=new Map()
io.on('connection', socket => {
    
    socket.on('join-room', (roomId, userId,username) => {
        socket.roomId=roomId;
        console.log("line 27",socket.roomId)
        socket.userId=userId
        socket.username=username;
        console.log("socket username",socket.username)
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId,username);
        
        socket.on('message', (message,username) => {
            io.to(roomId).emit('createMessage', message,username)
        }); 

        

        socket.on('disconnect', () => {
            console.log("hi")
            try{
                let currRoomId=socket.roomId;
                console.log(usersdict,currRoomId,socket.username)
                console.log("line 45",usersdict.get(currRoomId))
                let indexa=usersdict.get(currRoomId).indexOf(socket.username);
                usersdict.get(currRoomId).splice(indexa, 1);
                console.log("user leaving name is",socket.username)

            }
            catch(e){
                console.log(e,"did someone leave???")
            }
            io.to(roomId).emit('userlist',users);
            socket.emit("userlist",users)
            console.log("line 61",socket.userId,socket.username)
            socket.to(roomId).emit('user-disconnected', socket.userId,socket.username)
            io.to(roomId).emit("userAddRem",username,0)
            socket.emit("userAddRem",username,0)


        })

    })
    socket.on('share-screen-end',() => {
        console.log("71")
        socket.to(socket.roomId).emit('update-screen-share-status');
        console.log("73")
    })
    socket.on('add-Username',(username,roomId)=>{
        console.log("reached to server.js",username)
        console.log("socket room id line 58",roomId)
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
        console.log(usersdict)
        console.log("line 70",users)
        io.to(roomId).emit('userlist',users);
        socket.emit("userlist",users)
        io.to(roomId).emit("userAddRem",username,1)
        socket.emit("userAddRem",username,1)
    })
})

server.listen(process.env.PORT||443)
