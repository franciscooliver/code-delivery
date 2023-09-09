import { Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Producer } from '@nestjs/microservices/external/kafka.interface';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class RoutesGateway implements OnModuleInit {
  private kafkaProducer: Producer;

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.initProducer();
  }

  async initProducer() {
    this.kafkaProducer = await this.kafkaClient.connect();
  }

  @SubscribeMessage('new-direction')
  async handleMessage(client: Socket, payload: { routeId: string }) {
    if (!this.kafkaProducer) {
      await this.initProducer();
    }
    this.kafkaProducer.send({
      topic: 'route.new-direction',
      messages: [
        {
          key: 'route.new-direction',
          value: JSON.stringify({
            routeId: payload.routeId,
            clientId: client.id,
          }),
        },
      ],
    });
  }

  async sendPosition(data: {
    routeId: string;
    clientId: string;
    position: [number, number];
    finished: boolean;
  }) {
    console.log(data);
    const { clientId, ...rest } = data;
    const clients = await this.server.sockets.fetchSockets();
    const clienSocketIO = clients.filter((c) => c.id === clientId);
    console.log('Socket id: ' + clienSocketIO[0].id);
    if (!clienSocketIO[0]) {
      console.error(
        'Client not exists, refresh React Application an resend new direction again.',
      );
      return;
    }
    clienSocketIO[0].emit('new-position', rest);
  }
}
