import WebSocket from "./WebSocket";

const ws = new WebSocket('localhost', 4001);
ws.listen();
ws.connect();

