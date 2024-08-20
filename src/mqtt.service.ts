import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Server } from 'socket.io';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private mqttClient: mqtt.MqttClient;
  private socketServer: Server;

  constructor() {
    this.mqttClient = mqtt.connect('mqtt://localhost:1883');
  }

  onModuleInit() {
    this.setupMqttClient();
  }

  onModuleDestroy() {
    this.mqttClient.end();
  }

  setSocketServer(server: Server) {
    this.socketServer = server;
  }

  private setupMqttClient() {
    this.mqttClient.on('connect', () => {
      console.log('Connected to MQTT broker');
      this.mqttClient.subscribe('room/#');
    });

    this.mqttClient.on('message', (topic, message) => {
      const room = topic.split('/')[1];
      const messageStr = message.toString();
      console.log(`Received MQTT message on topic ${topic}: ${messageStr}`);

      if (this.socketServer) {
        this.socketServer.to(room).emit('message', {
          room: room,
          message: `MQTT: ${messageStr}`,
        });
      }
    });
  }

  publishMessage(room: string, message: string) {
    this.mqttClient.publish(`room/${room}`, message);
  }
}