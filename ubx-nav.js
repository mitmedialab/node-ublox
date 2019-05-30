const {UbxMessage} = require("./ubx");
const {toHex} = require("./common");
const {MessageDecodeError} = require("./error");
const {UBX_NAV, UBX_NAV_HPPOSLLH, UBX_NAV_SVIN} = require('./ubx-msgtypes');


class UbxNavMessage extends UbxMessage {
    constructor() {
        super();
        this.messageClass = UBX_NAV;
    }

    static decode(messageId, payload) {
        let message = null;

        switch(messageId) {
            case UBX_NAV_HPPOSLLH:
                message = UbxNavHPPosLLH.decode(payload);
                break;
            case UBX_NAV_SVIN:
                message = UbxNavSvin.decode(payload);
                break;
            default:
                message = new UbxNavMessage();
        }

        console.log(message);

        return message;
    }

    toString() {
        return "UBX-NAV-0x" + toHex(this.messageId, 2);
    }
}

class UbxNavHPPosLLH extends UbxNavMessage {
    constructor(options) {
        super();
        this.messageId = UBX_NAV_HPPOSLLH;
        this.payload = Object.assign({
            version: 0,
            iTOW: undefined,
            lon: undefined,
            lat: undefined,
            height: undefined,
            hMSL: undefined,
            hAcc: undefined,
            vAcc: undefined
        }, options);
    }

    static decode(data) {
        if(data.length < 36) {
            throw new MessageDecodeError("Payload too short for UBX-NAV-HPPOSLLH");
        }

        let message = new UbxNavHPPosLLH({
            version: data.readUInt8(0),
            iTOW: data.readUInt32LE(4),
            lon: data.readInt32LE(8) * 1e-7 + data.readInt8(24) * 1e-9,
            lat: data.readInt32LE(12) * 1e-7 + data.readInt8(25) * 1e-9,
            height: (data.readInt32LE(16) + data.readInt8(26) * 0.1) / 1000,
            hMSL: (data.readInt32LE(20) + data.readInt8(27) * 0.1) / 1000,
            hAcc: data.readUInt32LE(28) / 10000,
            vAcc: data.readUInt32LE(32) / 10000
        });

        return message;
    }

    toString() {
        let s = "UBX-NAV-HPPOSLLH ";
        s += this.payload.lat + "°, " + this.payload.lon + "° ± " + this.payload.hAcc + "m, ";
        s += this.payload.hMSL + " ± " + this.payload.vAcc + " m MSL";
        return s;
    }
}

class UbxNavSvin extends UbxNavMessage {
    constructor(options) {
        super();
        this.messageId = UBX_NAV_SVIN;
        this.payload = Object.assign({
            version: 0,
            iTOW: undefined,
            dur: undefined,
            meanX: undefined,
            meanY: undefined,
            meanZ: undefined,
            meanAcc: undefined,
            obs: undefined,
            valid: false,
            active: false
        }, options);
    }

    static decode(data) {
        if(data.length < 40) {
            throw new MessageDecodeError("Payload too short for UBX-NAV-SVIN");
        }

        let message = new UbxNavSvin({
            version: data.readUInt8(0),
            iTOW: data.readUInt32LE(4),
            dur: data.readUInt32LE(8),
            meanX: (data.readInt32LE(12) + data.readInt8(24) * 0.01) / 100,
            meanY: (data.readInt32LE(16) + data.readInt8(25) * 0.01) / 100,
            meanZ: (data.readInt32LE(20) + data.readInt8(26) * 0.01) / 100,
            meanAcc: data.readUInt32LE(28) / 10000,
            obs: data.readUInt32LE(32),
            valid: data.readUInt8(36) != 0,
            active: data.readUInt8(37) != 0
        });

        return message;
    }

    toString() {
        return "UBX-NAV-SVIN";
    }
}

module.exports = {UbxNavMessage};
