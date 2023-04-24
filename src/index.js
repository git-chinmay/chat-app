const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')





const pathToPublicDirectory = path.join(__dirname, "../public")
const app = express();
app.use(express.static(pathToPublicDirectory));




//we need to use epress slight differently when using socket.io
const server = http.createServer(app);
//socket.io alwys expects a 'http' server, that's why in previous step we explicylty created one
const io = socketio(server)
//Port configuration
const port = process.env.PORT || 3000





app.get("/", (req, res)=>{
    res.send("index")
})


//io.on(<eventname>, <call back func runs on event>)
io.on("connection", (socket)=>{

    //Receiving the username and room name of join page from client
    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({id:socket.id, username, room})

        if(error){
            return callback(error);
        }

        //socket.join onl be used at server side
        socket.join(user.room)


        // Server will send welcome message to new user
        socket.emit("message", generateMessage("System", "Welcome!"));
        socket.broadcast.to(user.room).emit("message", generateMessage("System",`${user.username} has joined the ${room} room.`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback(); //Indicating no issue while adding a new user

    })




    // As user senidg a callback in expetation of an acknowledgemnt so we can rewite CODE-x123 as below
    socket.on('sendMessage', (inputTextReceived, callback) => {

        // Check for profanity in user text
        const filter = new Filter();
        if(filter.isProfane(inputTextReceived)){
            return callback("Profanity not allowed in text messages.")
        
        }

        //Get userdata by the id so that can fetch room data
        const user = getUser(socket.id);

        //fornow hardcoded the room name 
        io.to(user.room).emit("message", generateMessage(user.username, inputTextReceived));
        callback(); //just executing the callback send by user
    } )




    //Server listenng the location data
    socket.on("sendLocation", (locationData, callback)=>{

        const user = getUser(socket.id);

        if(!locationData){
            return callback("No location data received from user.")
        }


        //Server emits the locations url
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${locationData.latitude},${locationData.longitude}`, locationData.timeStamp));
        callback();
    })




    //Broadcast when an user left
    // NOTE: io.on is only for connection, for disconnetion we need to use socket
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);

        if(user){
            //socket.broadcast.emit("message", "A user has left.")
            //socket broadcast will also works but as user already left so no harm in using io.emit
            io.to(user.room).emit("message", generateMessage("System", `${user.username} has left the ${user.room} chat room.`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


        
    })


})




server.listen(port, () => {
    console.log(`Server is running on ${port}.`)
})