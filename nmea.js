const GpsMessage = require("./message");
const {MessageDecodeError, MessageChecksumError} = require("./error");

class NmeaMessage extends GpsMessage {
    static identify(data) {
        return data.length > 6 && data.readUInt8(0) == 0x24;
    }

    static decode(data) {
        if(!NmeaMessage.identify(data)) {
            throw new MessageDecodeError("Not an NMEA message");
        }

        let message = null;;

        let sentence = data.toString().trim();
        if(sentence.charAt(sentence.length-3) !== '*') {
            throw new MessageDecodeError("Checksum marker at wrong location");
        }


        let payload = sentence.slice(1, -3);
        let checksum = parseInt(sentence.slice(-2), 16);
        let calc_csum = 0;
        for(let i=0; i<payload.length; i++) {
            calc_csum ^= payload.charCodeAt(i);
        }

        if(checksum != calc_csum) {
            throw new MessageChecksumError("NMEA Checksum error");
        }

        if(message === null) {
            message = new NmeaMessage()
        }
        message.data = data;
        message.sentence = sentence;

        return message;
    }

    toString() {
        return this.sentence;
    }
}

module.exports = {NmeaMessage};
