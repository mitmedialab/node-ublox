const GpsMessage = require("./message");
const {MessageDecodeError, MessageChecksumError, 
    MessageSerializationError} = require("./error");
const {toHex} = require("./common");

function ubxChecksum(data) {
    let ck_a = 0, ck_b = 0;
    for(let i=0; i<data.length; i++) {
        ck_a = (ck_a + data.readUInt8(i)) & 0xFF;
        ck_b = (ck_b + ck_a) & 0xFF;
    }

    return (ck_b << 8) + ck_a;
}

class UbxMessage extends GpsMessage {
    static identify(data) {
        return data.length >= 8 && data.readUInt16BE(0) == 0xB562;
    }

    static decode(data) {
        if(!UbxMessage.identify(data)) {
            throw new MessageDecodeError("Not an UBX message");
        }

        const {UbxNavMessage} = require("./ubx-nav");

        let message = null;
        let messageClass = data.readUInt8(2);
        let messageId = data.readUInt8(3);
        let length = data.readUInt16LE(4);

        if(data.length !== length + 8) {
            throw new MessageDecodeError("Invalid UBX message length");
        }

        let payload = data.slice(6, -2);
        let checksum = data.readUInt16LE(data.length-2);

        if(checksum !== ubxChecksum(data.slice(2, -2))) {
            throw new MessageChecksumError("Invalid UBX checksum");
        }

        switch(messageClass) {
            case 0x01:
                message = UbxNavMessage.decode(messageId, payload);
                break;
            default:
                message = new UbxMessage();
        }

        message.messageClass = messageClass;
        message.messageId = messageId;
        message.data = data;
        return message;
    }

    toString() {
        return "UBX-0x" + toHex(this.messageClass, 2) + "-0x" + toHex(this.messageId, 2);
    }

    serialize() {
        if(this.messageClass === undefined || this.messageId === undefined) {
            throw new MessageSerializationError("can't serialize generic message type");
        }

        let payload = this.serializePayload();
        let data = Buffer.alloc(8 + payload.length);
        data.writeUInt16BE(0xB562, 0); // sync
        data.writeUInt8(this.messageClass, 2);
        data.writeUInt8(this.messageId, 3);
        data.writeUInt16LE(payload.length, 4);
        payload.copy(data, 6);
        let crc = ubxChecksum(data.slice(2, -2));
        data.writeUInt16LE(crc, data.length-2);
        return data;
    }

    serializePayload() {
        throw new MessageSerializationError("unimplemented");
    }
}

module.exports = {UbxMessage};
