function checkMessage(data) {
  // Returning the type of message the websocket has received: 
  let messageType, i;
  if (data[9] === "o" || data[9] === "a") {
      i = 9;
  } else {
      i = 1;
  }
  console.log(data);
  //What kind of message can be determinated by data[i] letter: 
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