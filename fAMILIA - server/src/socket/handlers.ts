import { Socket } from 'socket.io';

import { io } from './../../server';
import { users } from './socket';
import config from './../config';

export function onSendMessage(client: any, data: any): void {
    try {
        if (data.room && data.message && data.username) {
            client.to(data.room).emit('conversation', { room: data.room, message: data.message, username: data.username });
        } else {
            io.to(client.id).emit(config.socketError.error, config.socketError.message);
        }
    } catch (error) {
        console.error('send message: ', error);
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onDisconnect(client: Socket, data: any): void {
    try {
        console.log(`Client disconnected: ${users.find(user => user.idClientSocket === client.id).email} (${data})`);
        users.splice(users.findIndex(user => user.idClientSocket === client.id), 1);
    } catch (error) {
        console.error('disconnect: ', error);
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onChatRequest(client: any, data: any): void {
    try {
        let from = users.find(user => user.email === data.from);
        let dest = users.find(user => user.email === data.dest);
        let room = from.id > dest.id ? `${dest.id}:${from.id}` : `${from.id}:${dest.id}`;

        client.join(room);
        client.to(dest['idClientSocket']).emit('chat request', { room: room, from: data.from });
    } catch (error) {
        console.error('onChatRequest: ', error.message);
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onChatAccepted(client: any, data: any): void {
    try {
        let dest = users.find(user => user.email == data.dest);

        if (data.room && data.accepted === true) {
            client.join(data.room);
            client.to(dest.idClientSocket).emit('chat accepted', { room: data.room, from: data.from });
        } else {
            client.to(dest.idClientSocket).emit('chat rejected', { from: data.from });
        }
    } catch (error) {
        console.error('onChatAccepted: ', error);
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onReceiveData(client: any, data: any): void {
    try {
        console.log(data);
    } catch (error) {
        console.error('onChatAccepted: ', error);
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
    }
}
