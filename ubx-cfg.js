const {UbxMessage} = require("./ubx");
const {UBX_CFG, UBX_CFG_MSG, UBX_CFG_RATE} = require('./ubx-msgtypes');
const {MessageDecodeError, MessageSerializationError} = require('./error');


class UbxCfgMessage extends UbxMessage {
    constructor() {
        super();
        this.messageClass = UBX_CFG;
    }
}

class UbxCfgMsg extends UbxCfgMessage {
    constructor(options) {
        super();
        this.messageId = UBX_CFG_MSG;
        this.payload = Object.assign({
            msgClass: undefined,
            msgId: undefined
        }, options);
    }

    serializePayload() {
        let pl = this.payload;
        if(pl.msgClass === undefined || pl.msgId === undefined) {
            throw new MessageSerializationError("missing required parameter");
        }

        let data = Buffer.alloc(pl.rate === undefined ? 2 :
            typeof(pl.rate) === "array"? 8 : 3);
        
        data.writeUInt8(pl.msgClass, 0);
        data.writeUInt8(pl.msgId, 1);

        if(typeof(pl.rate) === "array") {
            for(let i=0; i<6; i++) {
                data.writeUInt8(pl.rate[i], 2+i);
            }
        } else if(typeof(pl.rate) === "number") {
            data.writeUInt8(pl.rate, 2);
        }

        return data;
    }
}

class UbxCfgRate extends UbxCfgMessage {
    constructor(options) {
        super();
        this.messageId = UBX_CFG_RATE;
        this.payload = Object.assign({
            measRate: 1000,
            navRate: 1,
            timeRef: 1
        }, options);
    };

    serializePayload() {
        let pl = this.payload;
        let data = Buffer.alloc(6);
        data.writeUInt16LE(pl.measRate, 0);
        data.writeUInt16LE(pl.navRate, 2);
        data.writeUInt16LE(pl.timeRef, 4);

        return data;
    }
}

module.exports = {
    UbxCfgMessage,
    UbxCfgMsg,
    UbxCfgRate
}
