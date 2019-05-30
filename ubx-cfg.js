const {UbxMessage} = require("./ubx");
const {UBX_CFG, UBX_CFG_MSG} = require('./ubx-msgtypes');
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

module.exports = {
    UbxCfgMessage,
    UbxCfgMsg
}
