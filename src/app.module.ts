import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MqttService } from './mqtt.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ChatGateway, MqttService],
})
export class AppModule {}