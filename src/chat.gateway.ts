import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as mqtt from 'mqtt';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  private mqttClient: mqtt.MqttClient;

  constructor() {
    this.mqttClient = mqtt.connect('mqtt://localhost:1883');
    
    this.mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
    });

    this.mqttClient.on('message', (topic, message) => {
      // Handle incoming MQTT messages
      console.log(`Received message on topic ${topic}: ${message.toString()}`);
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
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.room).emit('message', {
      room: data.room,
      message: data.message,
    });

    // Publish message to MQTT
    this.mqttClient.publish(`room/${data.room}`, data.message);

    return { status: 'success', message: 'Message sent' };
  }
}