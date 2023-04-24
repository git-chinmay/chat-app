const generateMessage = (username, text) =>{
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}


// We can use the geolocation generated timestamp so we dont need to creat explicity
const generateLocationMessage = (username, url, timeStamp) => {
    return {
        username,
        url,
        createdAt: timeStamp
    }
}


module.exports = {
    generateMessage,
    generateLocationMessage
}