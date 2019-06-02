const {UbxMessage} = require("./ubx");
const {toHex} = require("./common");
const {MessageDecodeError} = require("./error");
const {UBX_ACK, UBX_ACK_ACK, UBX_ACK_NACK} = require ("./ubx-msgtypes");

class UbxAckMessage extends UbxMessage {
    constructor() {
        super();
        this.messageClass = UBX_ACK;
    }

    static decode(messageId, payload) {
        switch(messageId) {
            case UBX_ACK_ACK:
                return UbxAckAck.decode(payload);
            case UBX_ACK_NAK:
                return UbxAckNak.decode(payload);    
            default:
                return new UbxAckMessage();
        }
    }

    toString() {
        return "UBX-ACK-0x" + toHex(this.messageId, 2);
    }
}

class UbxAckAck extends UbxAckMessage {
    constructor(options) {
        super();
        this.messageId = UBX_ACK_ACK;
        this.payload = Object.assign({
            clsId: undefined,
            msgId: undefined
        }, options);
    }

    static decode(data) {
        if(data.length < 2) {
            throw new MessageDecodeError("Payload too short");
        }

        return new UbxAckAck({
            clsId: data.readUInt8(0),
            msgId: data.readUInt8(1)
        });
    }

    toString() {
        return "UBX-ACK-ACK";
    }
}

class UbxAckNak extends UbxAckMessage {
    constructor(options) {
        super();
        this.messageId = UBX_ACK_NAK;
        this.payload = Object.assign({
            clsId: undefined,
            msgId: undefined
        }, options);
    }

    static decode(data) {
        if(data.length < 2) {
            throw new MessageDecodeError("Payload too short");
        }

        return new UbxAckNak({
            clsId: data.readUInt8(0),
            msgId: data.readUInt8(1)
        });
    }

    toString() {
        return "UBX-ACK-ACK";
    }
}

module.exports = {
    UbxAckMessage,
    UbxAckAck,
    UbxAckNak
}

