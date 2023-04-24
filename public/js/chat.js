// This is client and index.js is our server //

const socket = io() //This is working because we have added /socket.io inside html file

// PLAYGROUND FOR CLIENT SIDE SOCKETIO //
// //Make sure this event matches ith vent in index.js io.on()
// //This is part of communication from server to client
// socket.on("countUpdated", (count)=>{
//     console.log("The count has been updated.", count)
// })


// //This is demonostrating communication from client to server 
// document.querySelector('#increment').addEventListener('click', ()=>{
//     console.log('clicked');
//     //Now emit an event and server will listen it
//     socket.emit('incremented')
// })


/// ELEMENTS ///

const messageForm = document.querySelector('#form-id-1');
const messageInputForm = messageForm.querySelector('input');
const messageButtonForm = messageForm.querySelector('button');
//const inputData = document.querySelector('input'); //This one fine if only 1 input filed inside form
const sendLocationBtn = document.querySelector('#send-location');
const messages = document.querySelector('#messages');


// TEMPLATES
const messageTemplate = document.querySelector('#message-template').innerHTML
const geolocTemplate = document.querySelector('#geoloc-template').innerHTML
const lcnHprlnkTemplate = document.querySelector('#location-hyperlink').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;


//OPTIONS
// It will parse the query string from join page so that (http://localhost:3000/chat.html?username=Julia&room=room1)
// we can extract username and room details and send it to chat.html
//Qs is coming from the cha.html qs.min.js
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});


// AUTOSCROLL
/*
This auto scroll is different than browser provided uto scroll which is by defaukt we will get a scrioll bar to when messages filled in visible area
This fuction is about If I have scrolled up to read old messages and at that time if some new mesages comes browser will automatically 
scrolled down the page hance will dirupt my reading, this function will prevent that. While I am reading the old messages the new incoming 
messages get added silently in background wihout interrupting.
This function is just to give some nice user experience.
*/
const autoScroll = () =>{
    // Remember by the time this function called new message already added to page

    //New message element
    const newMessageElement = messages.lastElementChild;

    //Get the margin(feching it from CSS)
    const newMessageStyles = getComputedStyle(newMessageElement);
    //console.log(newMessageStyles); //In browser console we can see the CSSStyleDeclaration object with array of elements
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);

    //Height of the last message(new message)
    const newMessageHeight = newMessageElement.offsetHeight + newMessageMargin;

    //Visible heights
    const visibleHeight = messages.offsetHeight

    //Height of messages container(Total height we can scroll through)
    const containerHeight = messages.scrollHeight;

    //How far down we scrolled through? Distance from top + Total visible height (we need this for auto scroll calcuation)
    //Amount of distance we scrolled from top  <scrollTop>
    const scrolledOffset = messages.scrollTop + visibleHeight; 

    //condition to making sure we are at the bottom before last message added
    if(containerHeight - newMessageHeight <= scrolledOffset){
        //Go for auto scroll
        message.scrollTop = messages.scrollHeight
    }
    
}


// CODE CHALLENGE //
//We have defined the Mustach & moment in index.html
socket.on("message", (msg)=>{
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format('hh:mm a') //https://momentjs.com/
    });
    messages.insertAdjacentHTML('beforeend', html); //insert new htmls bottom of the div
    autoScroll();
})


socket.on("locationMessage", (locationData)=>{
    console.log(locationData);
    const html = Mustache.render(lcnHprlnkTemplate, {
        username: locationData.username,
        url: locationData.url,
        createdAt: moment(locationData.createdAt).format('hh:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})


socket.on('roomData', ({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


// socket.on("message", (url)=>{
//     console.log(url)
//     const html = Mustache.render(geolocTemplate, {
//         loc: url
//     });
//     messages.insertAdjacentHTML('beforeend', html);
// })

//Listening the data from input field
// document.querySelector('form').addEventListener('submit', (e)=>{
//             e.preventDefault(); //To stop refreshing the browser
//             const inputText = document.querySelector('input').value;
//             console.log("Submit button clicked.")
//             console.log(`Input text: ${inputText}`);

//             //Send the event to server(index.js)
//             socket.emit("sendMessage", inputText);
//         })



// Sharing messages between server & client
messageForm.addEventListener('submit', (e)=>{
    e.preventDefault(); //To stop refreshing the browser

    //Disabling the submit button untill message sent
    messageButtonForm.setAttribute('disabled', 'disabled');

    //const inputText = inputData.value;
    const inputText = e.target.elements.message.value;

    //Send the event to server(index.js)
    //socket.emit("sendMessage", `User: ${inputText}`);

    //User can also send message and expect an acknowledgement from server
    // Here user sending the 'event', 'the text' and a callback func 
    socket.emit("sendMessage", inputText, (error)=>{

        //Enabling the button
        messageButtonForm.removeAttribute('disabled');

        //Clear the input field & set cursor focus to it
        messageInputForm.value = '';
        messageInputForm.focus();

        if(error){
            return console.log("Error in message delivery.", error)
        }
        console.log("Message delivered.")}
    )
})


/// Sharing geolocation ///
//https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

sendLocationBtn.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Your browser do not support this.');
    }

    //Disabling the button
    sendLocationBtn.setAttribute('disabled', 'disabled');

    //getCurrentPosition do not support promise-async yet so we will use standard callback
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position);
        const locationData = {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude,
            timeStamp: position.timestamp
        }
        //send the location to server
        socket.emit("sendLocation", locationData, (error)=>{
        
            //Enabling the send button
            sendLocationBtn.removeAttribute('disabled');

            if (error){
                console.log(error);
            }

            console.log("Location shared.")
        });
    })


})


// Sending the usrname and room details to server(extracted from join page)
socket.emit('join', {username, room}, (error)=>{
    if(error){
        alert(error);
        //Redirect the user to home page in case of error
        location.href = '/' //Redirecting to JOIN page
    }
});

/*
Location global varibale
{
    "ancestorOrigins": {},
    "href": "http://localhost:3000/",
    "origin": "http://localhost:3000",
    "protocol": "http:",
    "host": "localhost:3000",
    "hostname": "localhost",
    "port": "3000",
    "pathname": "/",
    "search": "",
    "hash": ""
}
*/

