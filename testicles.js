 // let http = require('http');
 // let server = require('websocket').server; 
 // // Creating server, listening at port 8080
 // let httpServer = http.createServer(() => { }); 
 // httpServer.listen(8080, () => {
 //     console.log(`Server listening at port 8080`);
 // })
 // // Making http server able to handle websocket connections 
 // let wsServer = new server({
 //     httpServer,
 // });
 // Creating different global variables
 /* They have different purposes: 
 *   clients: This variable holds all information on all the users. This i used when offers and answer are send to each other.
 *   whoOffered: if a client tries to connect to another, their userId will be assigned to whoOffered 
                 so the client that is answering knows who asked them.
 *   clientlist: An array which get assigned clients userid when they connect to the website, and removed when they disconnect.
 *   clientNames: An array which hold the different clients names at the userid index of the array.
 *   i: Is used for the for loop which fill the clientlist and clientNames arrays with 0 / space.
 */
 let clients = [], whoOffered, clientlist = [], clientNames = [], i;
 const maxNumberOfClients = 100;
 // Initialising all the index values in the clientlist and clientNames arrayes
 for(i = 0; i < maxNumberOfClients; i++){
     clientlist[i] = 0;
     clientNames[i] = "";
 }
 // Eventlistener for the websocket on requests. 
 wsServer.on('request', request => {
     /* creating local variables: 
     *    clientStr: This variable is a string of the userid which a client wants to send an offer/answer to.
     *    whichClient: This is an int which hold the userid which a client wants to send an offer/answer to.
     *    userId: All the clients have a unique Id, which is used to identify the clients in the clientlist array?  
     */
     const connection = request.accept();
     let clientStr, whichClient;
     let userId = 0;
     // Generating the unique userId, done by genearting a number between 0 and 1
     // and then multiplying it by the maxNumberOfClients
     do {
         userId = Math.floor(Math.random() * maxNumberOfClients);
     } while(userId == clientlist[userId])
  
     // Pushing the userId to the clientlist subscribted to the same value.
     clientlist[userId] = userId;
  
     // Pushing the connection object and the userId to the clients array.
     clients.push({connection, userId});
     // Eventlistener for the connection on message
     connection.on('message', message => {
         //checkMessage return what kind of message it is, eg. sdp offer/answer, specific message for client etc.
         let messageType = checkMessage(message.utf8Data);
         // Contact information object for the remote client, which make it possible to use userId if clientName is blank
         requestingClient = JSON.stringify({
             client: clientlist[userId],
             text: 'connecting user',
             clientname: clientNames[userId],
         });
         // The different procedures depending on the messageType. 
         switch (messageType) {
             case "offer": 
                 // First it sends the contact information of the user that offers, then it sends the sdp offer to the client.
                 sendToClient(whichClient, requestingClient);
                 sendToClient(whichClient, message.utf8Data);
                 whoOffered = userId;
                 break;
             case "answer": 
                 // First it sends the contact infromation of the user that answers, then it sends the sdp answer back to the client who created the offer.
                 sendToClient(whoOffered, requestingClient);
                 sendToClient(whoOffered, message.utf8Data);
                 break;
             case "name": 
                 // new client connected, updating the dropdown menu of those available for webRTC con. 
                 clientNames[userId] = message.utf8Data.split(" ")[1].split("\"")[0];
                 updateDropdown();
                 break;
             case "clientId": 
                 // determating what the recivers id is, and converting it to an integer 
                 clientStr = message.utf8Data.split("\"");
                 whichClient = parseInt(clientStr[1]);
                 console.log(whichClient);
                 break;
             default:
                 console.log("some error");
                 break;
         }
     });
  
     // Eventlistener for connection on close
     connection.on('close', () => {
         // If the Websocket connection is closed, the client is removed from the dropdown list of available clients
         // sending the message 'I disconnected' to remaining clients: 
         clients = clients.filter(client => client.userId !== userId);
         clients.forEach(client => client.connection.send(JSON.stringify({
           client: clientlist[userId],
           text: 'I disconnected',
         })));
         // Removing the client form the clientlist and from clientNames
         clientlist[userId] = 0;
         clientNames[userId] = "";
         // Updating the dropdown for the remaining
         updateDropdown();
     });
 });

function checkMessage(data){
    // Returning the type of message the websocket has received: 
    let messageType, i;
    if(data[9] == "o" || data[9] == "a"){
        i = 9;
    } else{
        i = 1;
    }
    console.log(data);
    // What kind of message can be determinated by data[i] letter: 
    switch (data[i]) {
        case "o":
            messageType = "offer";
            break;
        case "a":
            messageType = "answer";
            break;
        case "n":
            messageType = "name";
            break;
        case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
            messageType = "clientId";
            break;
        default:
            messageType = 0;
            break;
    }
    return messageType;
}

//module.exports = checkMessage();

function sendToClient(chosenClient, message){
    // This function is sending the data to a specifik choosen client
    // The clients are filtered so it only sends to a specific choosen client. Then it sends the message.
    clients
        .filter(client => client.userId == chosenClient)
        .forEach(client => client.connection.send(message));
}

function updateDropdown(){
    // Giving client.js a message to clear the dropdown list so it can be reloaded.
    clients.forEach(client => client.connection.send(
        JSON.stringify({
            text: 'firstId',
        })
    ));

    // Sending the updated dropdown to all in the clients array: 
    // This is done by going through all index'es un clientlist and checking if they are connected.
    for(i = 0; i < maxNumberOfClients; i++){
        if(clientlist[i] != 0){ 
            // If the client is connected it will send a message to all other users that is it connected.
            clients
                .filter(client => client.userId !== clientlist[i])
                .forEach(client => client.connection.send(
                    JSON.stringify({
                        client: clientlist[i],
                        text: 'I connected',
                        clientname: clientNames[i],
                    }) 
            ));
        } 
    }
}