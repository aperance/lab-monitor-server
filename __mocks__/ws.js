const EventEmitter = require("events");

class ServerMock extends EventEmitter {
  constructor() {
    super();
  }
}
const serverMock = new ServerMock();

class SocketMock extends EventEmitter {
  constructor() {
    super();
    this.send = jest.fn();
  }
}
const socketMock = new SocketMock();

const Server = jest.fn().mockImplementation(() => serverMock);

module.exports = {
  serverMock,
  socketMock,
  Server
};
