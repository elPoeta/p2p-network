import EventEmitter from 'events';
import net from 'net';
import { uuid } from './utils/uuid';

class WebSocket {
  private server: net.Server;
  private emitter: EventEmitter;
  private socket: null | net.Socket;
  private connections: Map<string, net.Socket>;
  constructor(private ip: string, private port: number) {
    this.server = this.createServer();
    this.emitter = new EventEmitter();
    this.connections = new Map();
    this.socket = null;
  }

  createServer(): net.Server {
    return net.createServer((socket: net.Socket) => {
      this.socket = socket;
    });
  }

  listen() {
    this.server.listen(this.port, this.ip);
    console.log(`Socket listen on host ${this.ip} at port ${this.port}`);
    return this;
  }

  connect() {
    this.socket = new net.Socket();
    this.socket.connect(this.port, this.ip, () => {
      this.newSocketHandler();
    });
    return this;
  }

  newSocketHandler() {
    const connectionId = uuid();
    console.log('uuid', connectionId)
    this.connections.set(connectionId, this.socket!);
    this.emitter.emit('connect', connectionId);

    this.socket!.on('close', () => {
      this.connections.delete(connectionId);
      this.emitter.emit('disconnect', connectionId);
    });

    this.socket!.on('data', (data: Buffer) => {
      this.emitter.emit('message', { connectionId, message: JSON.parse(data.toString()) });
    });

    this.socket!.on('error', err => {
      console.log("handled error");
      console.log(err.message);
    });
    console.log("## ", this.connections.keys())
  }
}

export default WebSocket;