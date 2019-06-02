const {EventEmitter} = require('events');
const UBloxChunker = require('./chunker');
const decode = require("./decoder");
const {Socket} = require('net');

class GpsReceiver extends EventEmitter {
    constructor(stream) {
        super();
        this.stream = stream;
        this.chunker = this.stream.pipe(new UBloxChunker);
        this.queue = [];
        this.inflight = null;

        this.chunker.on('data', (data) => {
            let message = decode(data);

            if(message instanceof 

            if(message !== null) {
                this.emit('message', message);
            }
        });
    }

    finish(result) {
        
    }

    write(data) {
        this.stream.write(data);
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
        });
    }
}

module.exports = {
    GpsReceiver,
    TelnetGpsReceiver
};
