import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer() server: Server;
  constructor() {}

  broadcastToRoom(room: string, message: string) {
    this.server.to(room).emit('message', { room, message });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    return { status: 'success', message: `Joined room ${room}` };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    return { status: 'success', message: `Left room ${room}` };
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket
  ) {
    // Broadcast the message to all clients in the room via Socket.IO
    this.server.to(data.room).emit('message', {
      room: data.room,
      message: data.message,
      id: client.id
    });
    return { status: 'success', message: 'Message sent' };
  }
}