//
// WebSocket chat server
// Implemented using Node.js
//
// Requires the websocket module.
//

import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import { server as WebSocketServer } from 'websocket';
import type { Request, Response } from 'express';
import type { Message, Connection } from '../models/index';

class Server {
    private connectionArray: Connection[] = [];
    private nextID = Date.now();
    private appendToMakeUnique = 1;

    // Load the key and certificate data to be used for our HTTPS/WSS
    // server.

    private express = express();
    private server: http.Server;
    private wsServer: WebSocketServer;
    constructor() {
        this.middleware();
        this.routes();
        this.server = http.createServer(this.express);
        console.log('***CREATING WEBSOCKET SERVER');
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
            autoAcceptConnections: false
        });
        this.handleEvents();
        console.log('***CREATED');
        this.listen();
    }

    middleware() {
        this.express.use(express.static('./dist'));
    }

    routes() {
        this.express.get('*', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });
    }

    listen() {
        this.server.listen(3000, () => {
            console.log(new Date() + ' Server is listening on port 3000');
        });
    }

    originIsAllowed(origin) {
        // This is where you put code to ensure the connection should
        // be accepted. Return false if it shouldn't be.
        return true;
    }

    isUsernameUnique(name: string): boolean {
        return this.connectionArray.every((item) => item.username !== name);
    }

    getConnectionForID(id) {
        const idx = this.connectionArray.findIndex((item) => item.clientID === id);

        return idx > -1 ? this.connectionArray[idx] : null;
    }

    makeUserListMessage() {
        // Add the users to the list

        return this.connectionArray.reduce(
            (acc, item) => {
                acc.users.push(item.username);
                return acc;
            },
            {
                type: 'userlist',
                users: []
            }
        );
    }

    sendUserListToAll() {
        const userListMsg = this.makeUserListMessage();
        const userListMsgStr = JSON.stringify(userListMsg);

        this.connectionArray.forEach((item) => item.sendUTF(userListMsgStr));
    }

    handleEvents(): void {
        this.wsServer.on('request', (request) => {
            console.log('Handling request from ' + request.origin);
            if (!this.originIsAllowed(request.origin)) {
                request.reject();
                console.log('Connection from ' + request.origin + ' rejected.');
                return;
            }

            // Accept the request and get a connection.

            const connection = request.accept('json', request.origin) as Connection;

            // Add the new connection to our list of connections.

            console.log(new Date() + ' Connection accepted.');
            this.connectionArray.push(connection);

            // Send the new client its token; it will
            // respond with its login username.

            connection.clientID = this.nextID;
            this.nextID++;

            let msg: Message = {
                type: 'id',
                id: connection.clientID
            };
            connection.sendUTF(JSON.stringify(msg));

            // Handle the "message" event received over WebSocket. This
            // is a message sent by a client, and may be text to share with
            // other users or a command to the server.

            connection.on('message', (message) => {
                console.log('***MESSAGE');
                if (message.type === 'utf8') {
                    console.log('Received Message: ' + message.utf8Data);

                    // Process messages

                    var sendToClients = true;
                    msg = JSON.parse(message.utf8Data);
                    var connect = this.getConnectionForID(msg.id);

                    // Look at the received message type and
                    // handle it appropriately.

                    switch (msg.type) {
                        // Public text message in the chat room
                        case 'message':
                            msg.name = connect.username;
                            msg.text = msg.text.replace(/(<([^>]+)>)/gi, '');
                            break;

                        // Username change request
                        case 'username':
                            var nameChanged = false;
                            var origName = msg.name;

                            // Force a unique username by appending
                            // increasing digits until it's unique.
                            while (!this.isUsernameUnique(msg.name)) {
                                msg.name = origName + this.appendToMakeUnique;
                                this.appendToMakeUnique++;
                                nameChanged = true;
                            }

                            // If the name had to be changed, reject the
                            // original username and let the other user
                            // know their revised name.
                            if (nameChanged) {
                                var changeMsg = {
                                    id: msg.id,
                                    type: 'rejectusername',
                                    name: msg.name
                                };
                                connect.sendUTF(JSON.stringify(changeMsg));
                            }

                            connect.username = msg.name;
                            this.sendUserListToAll();
                            break;
                    }

                    // Convert the message back to JSON and send it out
                    // to all clients.

                    if (sendToClients) {
                        this.sendUserListToAll();
                    }
                }
            });

            // Handle the WebSocket "close" event; this means a user has logged off
            // or has been disconnected.

            connection.on('close', (c) => {
                this.connectionArray = this.connectionArray.filter((el) => el.connected);
                this.sendUserListToAll(); // Update the user lists
                console.log(new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.');
            });
        });
        console.log('***REQUEST HANDLER CREATED');
    }
}

const app = new Server();
