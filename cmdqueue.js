const {EventEmitter} = require("events");

class CommandQueue extends EventEmitter {
    constructor(options) {
        super();
        this.options = Object.assign({
            timeout: 5000
        }, options);
        this.active = null;
        this.queue = [];
        this.timeout = null;
        this.checkResponse = function(command, response, resolve, reject) {
            resolve(response);
        };
    }

    _pump() {
        if(this.active !== null || this.queue.length < 1) return;
        this.active = this.queue.shift();
        this.emit("output", this.active.command);
        this.timeout = setTimeout(() => {
            this._reject(new CommandTimeoutError("Timed out after " +
                this.options.timeout + " ms"));
        }, this.options.timeout);
    }

    _finish(result) {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.active = null;
        this._pump();
    }

    _resolve(result) {
        this.active.resolve(result);
        this._finish();
    }

    _reject(error) {
        this.active.reject(error);
        this._finish();
    }

    input(response) {
        if(this.active === null) return;
        this.checkResponse(this.active.command, response, this._resolve.bind(this),
            this._reject.bind(this));
    }

    push(command) {
        return new Promise((resolve, reject) => {
            this.queue.push(new QueueItem(command, resolve, reject));
            this._pump();
        });
    }

    
}

class QueueItem {
    constructor(command, resolve, reject) {
        this.command = command;
        this.resolve = resolve;
        this.reject = reject;
    }
}

class CommandTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CommandTimeoutError';
    }
}

module.exports = CommandQueue;
