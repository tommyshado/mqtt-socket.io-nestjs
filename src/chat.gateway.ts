import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as mqtt from 'mqtt';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer() server: Server;
  private mqttClient: mqtt.MqttClient;

  constructor() {
    this.mqttClient = mqtt.connect('mqtt://localhost:1883');
    
    this.mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      // Then subscribe to all room topics
      this.mqttClient.subscribe("room/#");
    });

    this.mqttClient.on('message', (topic, message) => {
      const room = topic.split("/")[1]; // Assuming topic is 'room/room_name'
      // Handle incoming MQTT messages
      console.log(`Received MQTT message on topic ${topic}: ${message.toString()}`);

      // Broadcast the message to all clients in the room via Socket.IO
      this.server.to(room).emit("message", {
        room: room,
        message: `MQTT: ${message.toString()}`,
      });
    });
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

    // Publish message to MQTT, to be able to send the messages to Socket.IO
    this.mqttClient.publish(`room/${data.room}`, data.message);

    return { status: 'success', message: 'Message sent' };
  }
}