import { Socket } from 'socket.io';

import { io } from '../../server';
import config from './../config';
import { checkToken } from '../middleware';
import {onChatAccepted, onChatRequest, onDisconnect, onReceiveData, onSendMessage} from './handlers';

let users: Array<any> = [];
let clients: Array<any> = [];

export { users, clients }

export async function ioUse(socket: Socket, next: () => any) {
    try {
        if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.imei && socket.handshake.query.imei != 'null') {
            let authData = await checkToken(socket.handshake.query.token) as any;
            if (users.find(user => user.email === authData.email) === undefined && authData.tip !== 4) {
                users.push({ id: authData.id, idClientSocket: socket.id, email: authData.email, imei: socket.handshake.query.imei });
                await next();
            } else {
                io.to(socket.id).emit(config.socketError.error, config.socketError.message);
            }
        }
    } catch (error) {
        io.to(socket.id).emit(config.socketError.error, config.socketError.message);
        console.log(error);
    }
}

export async function onConnection(client: Socket) {
    try {
        console.log(`Client connected: ${users.find(user => user.idClientSocket === client.id).email}`);

        client.on('ping', data => onReceiveData(client, data));

        client.on('send message', data => onSendMessage(client, data));

        client.on('chat request', data => onChatRequest(client, data));

        client.on('chat accepted', data => onChatAccepted(client, data));

        client.on('disconnect', data => onDisconnect(client, data));

    } catch (error) {
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
        console.error(error);
    }
}

export async function locationUse(socket: Socket, next: () => any) {
    try {
        if (socket.handshake.query && socket.handshake.query.token && socket.handshake.query.imei && socket.handshake.query.imei != 'null') {
            let authData = await checkToken(socket.handshake.query.token) as any;
            if (clients.find(user => user.email === authData.email) === undefined && authData.tip !== 4) {
                clients.push({ socket, imei: socket.handshake.query.imei });
                await next();
            } else {
                io.to(socket.id).emit(config.socketError.error, config.socketError.message);
            }
        }
    } catch (error) {
        io.to(socket.id).emit(config.socketError.error, config.socketError.message);
        console.log(error);
    }
}

export async function locConection(client: Socket) {
    try {
        console.log(`Client connected to location socket: ${clients.find(user => user.socket.id === client.id).imei}`);

        client.on('disconnect', reason => {
            console.log(`${clients.find(user => user.socket.id === client.id).imei}: Client disconnected! (${reason})`);
            clients.splice(clients.findIndex(c => c.socket.id === client.id), 1);
        });
    } catch (error) {
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
        console.error(error);
    }
}
