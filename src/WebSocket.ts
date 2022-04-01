import EventEmitter from 'events';
import net from 'net';
import { uuid } from './utils/uuid';

class WebSocket {
  private server: net.Server;
  private emitter: EventEmitter;
  private socket: null | net.Socket;
  private connections: Map<string, net.Socket>;
  private NODE_ID: string;
  private neighbors: Map<string, string>;

  constructor(private ip: string, private port: number) {
    this.server = this.createServer();
    this.emitter = new EventEmitter();
    this.connections = new Map();
    this.socket = null;
    this.NODE_ID = uuid();
    this.neighbors = new Map();

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
      try {
        this.emitter.emit('message', { connectionId, message: JSON.parse(data.toString()) });
      } catch (e) {
        console.error(`Cannot parse message from peer ${data.toString()}  error -> ${e}`);
      }
    });

    this.socket!.on('error', err => {
      console.log("handled error");
      console.log(err.message);
    });
    console.log("## ", this.connections.keys())
  }

  findNodeId(connectionId: string) {
    for (let [nodeId, connId] of this.neighbors) {
      if (connectionId === connId) {
        return nodeId;
      }
    }
  }

  emitte() {
    this.emitter.on('connect', (connectionId: string) => {
      this.send(connectionId, { type: 'handshake', data: { nodeId: this.NODE_ID } });
    });

    this.emitter.on('message', ({ connectionId, message }) => {
      const { type, data } = message;

      if (type === 'handshake') {
        const { nodeId } = data;

        this.neighbors.set(nodeId, connectionId);
        this.emitter.emit('node-connect', { nodeId });
      }

      if (type === 'message') {
        const nodeId = this.findNodeId(connectionId);

        this.emitter.emit('node-message', { nodeId, data });
      }
    });

    this.emitter.on('disconnect', (connectionId: string) => {
      const nodeId = this.findNodeId(connectionId);
      if (nodeId)
        this.neighbors.delete(nodeId);
      this.emitter.emit('node-disconnect', { nodeId });
    });

  }
  send(connectionId: string, message: any) {
    const socket = this.connections.get(connectionId);

    if (!socket) {
      throw new Error(`Attempt to send data to connection that does not exist ${connectionId}`);
    }

    socket.write(JSON.stringify(message));
  }
}

export default WebSocket;