import { io } from './../App';
import { users } from './Socket';
import { config } from './../config';

export function onSendMessage(data: any): void {
    try {
        console.log('Message: ', data);
        if (data.room && data.message && data.username) {
            this.to(data.room).emit('conversation', { room: data.room, message: data.message, username: data.username });
        } else {
            io.to(this.id).emit(config.socketError.error, config.socketError.message);
        }
    } catch (error) {
        console.error('send message: ', error);
        io.to(this.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onDisconnect(data: any): void {
    try {
        console.log(`Client disconnected: ${users.find(user => user.idClientSocket === this.id).email} (${data})`);
        users.splice(users.findIndex(user => user.idClientSocket === this.id), 1);
    } catch (error) {
        console.error('disconnect: ', error);
        io.to(this.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onChatRequest(data: any): void {
    try {
        let from = users.find(user => user.email === data.from);
        let dest = users.find(user => user.email === data.dest);
        let room = from.id > dest.id ? `${dest.id}:${from.id}` : `${from.id}:${dest.id}`;

        this.join(room);
        this.to(dest['idClientSocket']).emit('chat request', { room: room, from: data.from });
    } catch (error) {
        console.error('onChatRequest: ', error.message);
        io.to(this.id).emit(config.socketError.error, config.socketError.message);
    }
}

export function onChatAccepted(data: any): void {
    console.log("Data: ", data);
    try {
        let dest = users.find(user => user.email == data.dest);

        if (data.room && data.accepted === true) {
            this.join(data.room);
            this.to(dest.idClientSocket).emit('chat accepted', { room: data.room, from: data.from });
        } else {
            this.to(dest.idClientSocket).emit('chat rejected', { from: data.from });
        }
    } catch (error) {
        console.error('onChatAccepted: ', error);
        io.to(this.id).emit(config.socketError.error, config.socketError.message);
    }
}