var TwitchBot = require("node-twitchbot");
var auth = require("./twitchAuth.js");
var net = require('net');
var spawns = [];
var HOST = 'localhost';
var PORT = 31655;

var Bot = new TwitchBot(auth);
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

var client = new net.Socket();

client.connect(PORT, HOST, function() {
    //write message once connected to game
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
});

client.on('data', function(data) {
    buffer = getInts(data);
    switch(buffer[1]) {
        case 0:
            //Security packet
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
            //connected to game
            console.log('confirm connect');
            break;
        case 2:
            //disconnected from game
            console.log('disconnect');
            client.close();
            break;
        case 3:
            //spawn created, so add it to spawnlist
            if (buffer[3] == 2 & buffer[4] == 0) {
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
    //get event from buffer
    intlist = [];
    for(i = 0; i < buffer.length; i += 4) {
        intlist.push(buffer.readUInt32LE(i));
    }
    return intlist;
}

function addMessage(user, message) {
    //see message from twitch
    var msgArr = message.toString().split(" ");
    switch(msgArr[0]) {
        //Spawn message from users
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
        //Help users see how message should be formatted
        case '!help':
            Bot.msg("Type '!spawn (robot/wizard) (location)' to play, for example '!spawn robot 1'");
        default:
            break;
    }
}
