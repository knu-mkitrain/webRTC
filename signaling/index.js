
const _ = require('lodash');
const express = require("express");
const http = require("http");
const cors = require('cors');
const socket = require('socket.io');
const path = require("path");

const app = express();
const server = http.Server(app);
const io = socket(server);

server.listen(8080, function () {
    console.log("listening");
});

app.use(cors());
app.use(express.static(path.join(__dirname,"../front")));

app.get('/broadcaster', function (req, res) {
    res.sendFile(path.join(__dirname,"../front/html/broadcaster.html"));
});

app.get('/viewer', function (req, res) {
    res.sendFile(path.join(__dirname,"../front/html/viewer.html"));
});

var viewers = {};
var broadCasters = {};
var rooms = {};
var roomNum = 0;
var username;
users = [];
userarrayforlist = [];
var broadCasterlist =[];


// connection이 발생할 때 핸들러를 실행한다.
io.on('connection', function (socket) {

    io.sockets.clients((e, c) => {
        console.log("연결됨, 현재 연결된 클라이언트의 수 : ", c.length)
    });

    socket.on('join', function (data) {
        socket.join(data.room);
        username = data.user_name;
    })

    socket.on('setUsername', function (data) {
        if (users.indexOf(data) == -1) {
            data.username = data;
            users.push(data);
            userarrayforlist.push(data);
            socket.emit('userSet', { "username": data });
        } else {
            socket.emit('userExists', data + ' username is already taken! Try some other username.');
        }
    });

    socket.on('disconnect', reason => {
        roomId = broadCasters[socket.id];
        console.log(roomId + '  :  ' + socket.id);
        delete rooms[roomId];
        console.log(users);
        console.log("지운후 모든 방의 정보", rooms);

    });

    //방송자로부터 생성할 room id를 받는다.
    socket.on('broadCasterConnected', (data) => {
        //rooms[roomId] 는 배열로 구성되고, 0번째 index 는 broadCaster, broadCaster의 방이 어디인지 기록한다.

        rooms[data.roomId] = [socket.id];
        broadCasters[socket.id] = data.roomId;
        roomNum = Object.keys(rooms).length;

        var broacaterdata = {name: data.broadcastername,room : data.roomId};
        broadCasterlist.push(broacaterdata);

        io.emit('roomList', {
            roomlist: broadCasterlist
        });

        console.log("새로운 방을 생성합니다.", rooms[data.roomId]);
        console.log("삽입 후 모든 방의 정보", rooms);

    });

    //뷰어가 접속할 방을 서버에 전송한다.
    socket.on('viewerConnected', (data) => {
        if (!rooms[data.roomId]) {
            console.log("방이 존재하지 않습니다.");
            return;
        }
        //room에 viewer를 push 하고, viewer 가 어느 room 에 들어간지 기록한다.
        rooms[data.roomId].push(socket.id);
        viewers[socket.id] = data.roomId;
        console.log("방에 참가했습니다.", rooms);

    });

    //send offerSdp to broadCaster
    socket.on('sendOfferSdp', (data) => {
        var broadCaster = rooms[data.room][0];
        io.to(broadCaster).emit('sendOfferSdp', {
            offerSdp: data.sdp,
            from: data.from,
        })
    });

    //send answerSdp to viewer
    socket.on('sendAnswerSdp', (data) => {
        io.to(data.to).emit('sendAnswerSdp', {
            answerSdp: data.sdp,
            from: data.from,
        })
    });

    socket.on('sendCandidate', (data) => {
        //console.log("send candidate", data);
        io.to(data.to).emit('sendCandidate', {
            candidate: data.candidate,
            from: data.from,
        })
    });

    socket.on('msg', function (data) {
        //Send message to everyone
        console.log(data.room);
        io.sockets.in(data.room).emit('newmsg', data);
    });


    //연결 종료
    socket.on('disconnecting', (reason) => {
        //만약 방송자이면, 방 참가자들에게 종료 이벤트를 내보내고 방을 제거한다.
        if (broadCasters[socket.id]) {
            var roomId = broadCasters[socket.id];

            rooms[roomId].forEach((viewer) => {
                if (socket.id === viewer) return;

                io.to(viewer).emit("broadCastingEnd", {}); //종료 이벤트 전송
                viewers[viewer] = ""; //뷰어 방 기록 제거
            });

            _.omit(rooms, [roomId]); //방 목록에서 제거
            _.omit(broadCasters, socket.id); //방송자 목록에서 제거
            console.log("방이 제거되었습니다.");
        }
        else {
            var roomId = viewers[socket.id];

            _.pull(rooms[roomId], socket.id); //방 안에서 해당 뷰어 제거
            _.omit(viewers, socket.id); //뷰어 목록에서 제거
            console.log("방에서 성공적으로 제외되었습니다.", rooms[roomId]);
        }
    })


    //client에게 연결이 되었다고 알림
    socket.emit('success', {
        "result": "success",
        "msg": "connected successful",
        "room_num": roomNum,
        "username": userarrayforlist.pop()
    });

    socket.emit('roomList', {
        roomlist: broadCasterlist
    })
});
