import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { Server } from 'socket.io';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private mqttClient: mqtt.MqttClient;

  constructor(private chatGateway: ChatGateway) {
    this.mqttClient = mqtt.connect('mqtt://localhost:1883');
  }

  onModuleInit() {
    this.setupMqttClient();
  }
  onModuleDestroy() {
    this.mqttClient.end();
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
      this.chatGateway.broadcastToRoom(room, `MQTT: ${messageStr}`);
    });
  }
}