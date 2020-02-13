import { io } from './../App';
import { config } from './../config';
import { checkToken } from './../Token';
import { onChatAccepted, onChatRequest, onDisconnect, onSendMessage } from './SocketHandlers';

let users = [];
let clients = [];

export { users, clients }

export async function ioUse(socket, next) {
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

export async function onConnection(client) {
    try {
        console.log(`Client connected: ${users.find(user => user.idClientSocket === client.id).email}`);

        client.on('send message', onSendMessage.bind(client));

        client.on('chat request', onChatRequest.bind(client));

        client.on('chat accepted', onChatAccepted.bind(client));

        client.on('disconnect', onDisconnect.bind(client));

    } catch (error) {
        io.to(client.id).emit(config.socketError.error, config.socketError.message);
        console.error(error);
    }
}

export async function locationUse(socket, next) {
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

export async function locConection(client) {
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