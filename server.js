const http = require('http');
const querystring = require('querystring');
const net = require ('net');
const PORT_HTTP = 4000;
const PORT_NTP = 6000;
const HOST= '10.9.11.236'; //'127.0.0.1';

//----------------NTP Server (TCP)--------------------------------//

var serverNtp = net.createServer(function (socket){

    socket.on('data', function(data){
        var T2 = new Date();
        var T3 = new Date();
        socket.write(data.toString() + ',' + T2.getTime().toString() +','+ T3.getTime().toString());  //le mando al cliente la hora actual del servidor
    });

    socket.on('error', (error)=>{
        console.log('Algun cliente se desconectó de la sala'+ '('+error+')');
    })
});

serverNtp.on('close',function(){
    console.log('Server NTP cerrado');
});

serverNtp.listen(PORT_NTP,HOST);
console.log('Servidor NTP escuchando en puerto ' + PORT_NTP);

//-------------------Server HTTP------------------------------//

var user_sessions = [];

var serverHttp = http.createServer(function (req, res)
{
    let parts= req.url.split('?');
    switch(parts[0]){
        case '/register':
            let query = querystring.parse(parts[1]);
            registraUsuario(query);
            console.log('Lista de nodos activos:');
            console.log(user_sessions);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(user_sessions));
        break;

        case '/userlist':
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods','GET,PUT,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(user_sessions));
        break;
    }
});

serverHttp.listen(PORT_HTTP, function (){
    console.log('Servidor HTTP escuchando en puerto '+ PORT_HTTP);
});

function registraUsuario(query){
    var user = {
        username: query.username,
        ip : query.ip,
        port : query.port,
        timestamp : new Date()
    }
    var found = false; 
    user_sessions.forEach(function(item){
        if(item.username == user.username && item.ip == user.ip && item.port == user.port){
            item.timestamp = new Date();
            found =true;
        }
    });
    if (! found)
         user_sessions.push(user);
}

function controlaSesiones(){
    console.log('Controlando sesiones:');
    user_sessions.forEach(function(value){
        let time_actual = new Date().getTime();
        if(  (time_actual - value.timestamp.getTime() ) > 90000 ){
            user_sessions.splice(user_sessions.indexOf(value), 1);
            console.log('Se elimino el elemento: ' );
            console.log(value);
        }
    })
}

setInterval(controlaSesiones, 1000*30);