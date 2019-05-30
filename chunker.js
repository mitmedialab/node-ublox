const {Transform} = require('stream');


class UBloxChunker extends Transform {
    constructor() {
        super();
        this.buffer = Buffer.alloc(0);
        this.garbage = Buffer.alloc(0);
    }

    _transform(chunk, encoding, cb) {
        let data = Buffer.concat([this.buffer, chunk])
        let position;
        while(data.length > 0) {
            if(data.readUInt8() == 36) {
                /* NMEA */
                let position;
                if((position = data.indexOf('\r\n')) !== -1) {
                    this.push(data.slice(0, position+2));
                    data = data.slice(position+2);
                } else {
                    break;
                }
            } else if(data.readUInt8() == 0xB5) {
                /* UBX */
                if(data.length < 6) {
                    break;
                } 
                if(data.readUInt8(1) != 0x62) {
                    data = data.slice(1);
                    continue;
                }

                let length = data.readUInt16LE(4);
                let totalLength = length + 8;
                if(data.length < totalLength) {
                    break;
                }
                let message = data.slice(0, totalLength);
                this.push(message);
                data = data.slice(totalLength);
            } else if(data.readUInt8() == 0xD3) {
                /* RTCM3 */
                if(data.length < 6) {
                    break;
                }
                let length = data.readUInt16BE(1) & 0x3FF;
                if(data.length < 6 + length) {
                    break;
                }
                let message = data.slice(0, length + 6);
                this.push(message);
                data = data.slice(length + 6);
            } else {
                /* Garbage/Unknown */
                let c = data.readUInt8();
                console.log("C", c, String.fromCharCode(c));

                data = data.slice(1);
            }
        }

        this.buffer = data;
        cb();
    }

    _flush(cb) {
        this.push(this.buffer);
        this.buffer = Buffer.alloc(0);
        cb();
    }
}

module.exports = UBloxChunker;

