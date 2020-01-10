const {EventEmitter} = require('events');
const UBloxChunker = require('./chunker');
const decode = require("./decoder");
const CommandQueue = require("./cmdqueue");
const {MessageTypeError} = require("./error");
const {UbxCfgMessage} = require("./ubx-cfg");
const {UbxAckMessage, UbxAckAck, UbxAckNack} = require("./ubx-ack");
const {Socket} = require('net');

class GpsReceiver extends EventEmitter {
    constructor(stream) {
        super();
        this.stream = stream;
        this.chunker = this.stream.pipe(new UBloxChunker);
        this.queue = new CommandQueue();

        this.chunker.on('data', (data) => {
            let message = null;

            try {
                message = decode(data);
            } catch(e) {
                this.emit('error', e);
            }

            if(message !== null) {
                this.emit('message', message);
                this.queue.input(message);
            }
        });

        this.queue.checkResponse = (command, response, resolve, reject) => {
            if(!(command instanceof UbxCfgMessage)) {
                reject(new MessageTypeError("Command must be UbxCfgMessage"));
                return;
            }

            if(response instanceof UbxAckMessage &&
              response.payload.clsId == command.messageClass &&
              response.payload.msgId == command.messageId) {
                if(response instanceof UbxAckAck) {
                    resolve(response);
                } else {
                    reject(response);
                }
            }
        }

        this.queue.on("output", (command) => {
            this.stream.write(command.serialize());
        });
    }

    request(command) {
        return this.queue.push(command);
    }

    write(data) {
        this.stream.write(data);
    }

    async setRate(measRate, options) {
        const {UbxCfgRate} = require("./ubx-cfg");
        options = Object.assign({
            navRate: 1,
            timeRef: 1
        }, options);
        return this.request(new UbxCfgRate({
            measRate, navRate: options.navRate, timeRef: options.timeRef
        }));
    }

    async setMessageRate(msgClass, msgId, rate) {
        const {UbxCfgMsg} = require("./ubx-cfg");
        return this.request(new UbxCfgMsg({
            msgClass, msgId, rate
        }));
    }

    async setNavConfig(options) {
        const {UbxCfgNav5} = require("./ubx-cfg");
        return this.request(new UbxCfgNav5(options));
    }
}

class TelnetGpsReceiver extends GpsReceiver {
    constructor(host, port) {
        super(new Socket());

        this.port = port || 2002;
        this.host = host || 'localhost';
        this.socket = this.stream;

        this.socket.on('close', () => {
            console.log('Socket closed');
            setTimeout(() => {
                this.connect();
            }, 5000);
        });

        this.socket.on('error', (e) => {
            console.log('socket error: ', e);
        });

        this.connect(host, port);
    }

    connect(host, port) {
        if(host !== undefined) this.host = host;
        if(port !== undefined) this.port = port;
        console.log("Connecting to %s:%d", this.host, this.port);
        this.socket.connect(this.port, this.host, () => {
            console.log('Socket connected');
            this.emit('connected');
        });
    }
}

module.exports = {
    GpsReceiver,
    TelnetGpsReceiver
};
