'use strict';
// Imports dependencies and set up http server
const 
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express().use(bodyParser.json()), // creates express http server
    request = require('request'),
    fs = require('fs'),
    util = require('util');

//constantes para trabajo interno
const
    logFile = fs.createWriteStream('log.csv', {
        flags: 'w'
    }),
    logStdout = process.stdout;


//función que guarda lo que se despliegue por consola.
console.log = function() {
    logFile.write(util.format.apply(null, arguments) + '\n');
    logStdout.write(util.format.apply(null, arguments) + '\n');
}

//rutas
app.get('/message', function(req, res) {

    //guardamos access_token
    const access_token = req.query.access_token;

    //guardamos las rutas de acceso a API
    let myURL = 'https://graph.facebook.com/v5.0/';
    let convsURL = myURL + 'CaribbeanParadiseHotel/conversations' + '?access_token=' + access_token;
    request(convsURL, function(error, response, body) {
        if (!error) {
            //las conversaciones se guardan
            let conversaciones = JSON.parse(body);
            for (let x in conversaciones.data) {
                //las rutas de los mensajes se guardan.
                let mensajesURL = myURL + conversaciones.data[x].id + '?fields=messages&access_token=' + access_token;
                //Se hace un request por conversación para ver sus mensajes.
                request(mensajesURL, function(error, response, body) {
                    if (!error) {
                        //los mensajes lo guardan.
                        let mensajes = JSON.parse(body);
                        for (let y in mensajes.messages.data) {
                            //se guarda los mensajes individuales
                            let mensajeURL = myURL + mensajes.messages.data[y].id + '?fields=message&access_token=' + access_token;
                            //se hace una última petición solicitando acceso a los mensajes individuales
                            request(mensajeURL, function(error, response, body) {
                                if (!error) {
                                    let info = JSON.parse(body);


                                    //solo vamos a dejar que se escriban números o correos
                                    let correo= new RegExp("([aA-zA]|[0-9])+@.+(.){4}((.){3})?"); //\s[aA-zA]+@.+\.(.){3}((.){3})? regex para correo
                                    let numero= new RegExp("([0-9].?){10}"); //([0-9].?){10} regex para número de teléfono

                                    let numero_obtenido = numero.exec(info.message);
                                    let correo_obtenido = correo.exec(info.message);

                                    //si encuentra algún dato en la linea obtenida, solamente la imprime
                                    if(numero_obtenido){
                                        console.log(mensajes.messages.data[y].created_time + ',' + conversaciones.data[x].id + ',' + numero_obtenido[0]);
                                        
                                    }
                                    else if(correo_obtenido){
                                        console.log(mensajes.messages.data[y].created_time + ',' + conversaciones.data[x].id + ',' + correo_obtenido[0]);    
                                    }x
                                } else {
                                    res.status(400).send('Error al conseguir mensaje: ' + error);
                                }
                            });
                        }
                    } else {
                        res.status(400).send('Error al conseguir mensajes: ' + error);
                    }
                });
            }
        } else {
            res.status(400).send('Error al conseguir conversaciones' + error);
        }
    });

    if(!access_token){
        res.status(500).send('Token de acceso invalido');
    }
    else{
        res.status(200).send('Archivo creado');
    }
    
});

app.get('/lectura', function(req, res) {
    fs.open('log.csv', 'r', (err, fd) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('myfile does not exist');
                return;
            }
            res.status(400).send(err);
        }
        res.sendFile('log.csv' , { root : './'});
    });
});


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => {
    console.log("Messenger Funciona");
});