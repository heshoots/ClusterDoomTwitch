var twitch = require("twitch-webchat");
var auth = require("./twitchAuth.js");
var TwitchBot = require("node-twitchbot");
const Bot = new TwitchBot(auth);

Bot.connect().then(() => {
    console.log("Connected to twitch!");
    Bot.listen((err, chatter) => {
        if (err) {
            console.log(err);
        }
        else {
            addMessage(chatter.user, chatter.msg);
        }
    });
});

var net = require('net');
var HOST = 'localhost';
var PORT = 31655;
var client = new net.Socket();
var spawns = [];

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client 
});

client.on('data', function(data) {
    buffer = getInts(data);
    switch(buffer[1]) {
        case 0:
            console.log('welcome');
            console.log('verify this: ' + buffer[2]);

            var arr = new Uint32Array(3);
            arr[0] = 0;
            arr[1] = security(buffer[2]);
            arr[2] = 12;
            var buf = Buffer.from(arr.buffer);
            client.write(buf);
            break;
        case 1:
            console.log('confirm connect');
            break;
        case 2:
            console.log('disconnect');
            client.close();
            break;
        case 3:
            if (buffer[3] == 2 & buffer[4] == 0) {
                console.log(buffer);
                console.log("spawn created");
                spawns.push({id: buffer[2]});
            }
            break;
        default:
            break;
    }
});

client.on('close', function() {
    console.log('Connection closed');
});

function security(token) {
    token *= 22;
    token += 1337;
    token >>= 1;
    token &= 41256235;
    token -= 3590324;
    return token;
}

function getInts(buffer) {
    intlist = [];
    for(i = 0; i < buffer.length; i += 4) {
        intlist.push(buffer.readUInt32LE(i));
    }
    return intlist;
}
/*
var controls = twitch.start('smbf_quora', (err, message) => {
  if (err) throw err
  switch (message.type) {
    case 'chat': // chat message from the channel 
      var user = message.from
      var text = message.text // chat message content as text string 
      var html = message.html // chat message content as html string 
 
      var isModerator = !!message.moderator // user is a moderator 
      var isSubscriber = !!message.subscriber // user is a subscriber 
      var isPrime = !!message.prime // user is twitch prime member 
 
      console.log(user + ": " + text)
      addMessage(text, user);
      break
    case 'system': // system message from the channel 
      // (subscription messages, channel mode messages etc) 
      console.log('[system]: ' + message.text)
      break
    case 'tick': // DOM polled for messages 
    case 'debug': // various debug messages 
    default: // ignore 
  };
});
*/
function addMessage(user, message) {
    var msgArr = message.toString().split(" ");
    console.log(spawns);
    console.log(msgArr);
    switch(msgArr[0]) {
        case '!spawn':
            var arr = new Uint32Array(4);
            if (spawns.length > msgArr[2]) {
                arr[0] = 2;
                arr[1] = spawns[msgArr[2]].id;
                arr[2] = 0;
                if(msgArr[1] == 'robot') {
                    arr[3] = 1;
                    console.log('client spawn robot at ' + spawns[msgArr[2]].id);
                }
                if(msgArr[1] == 'wizard') {
                    arr[3] = 2;
                    console.log('client spawn wizard at ' + spawns[msgArr[2]].id);
                }
                arr[4] = 16;
                var buf = Buffer.from(arr.buffer);
                client.write(buf);
                Bot.msg("Thanks! PogChamp");
            }
            else {
                Bot.msg("Sorry @" + user + " that spawn is unavailable BabyRage");
            }
            break;
        case '!help':
            Bot.msg("Type '!spawn (robot/wizard) (location)' to play, for example '!spawn robot 1'");
        default:
            break;
    }

}
