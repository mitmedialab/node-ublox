const {UbxMessage} = require("./ubx");
const {UBX_CFG, UBX_CFG_MSG, UBX_CFG_RATE, UBX_CFG_NAV5} = require('./ubx-msgtypes');
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

class UbxCfgNav5 extends UbxCfgMessage {
    constructor(options) {
        super();
        this.messageId = UBX_CFG_NAV5;
        // there are a bunch of options we haven't implemented because we
        // haven't needed them yet
        [
            "fixMode",
            "fixedAlt",
            "fixedAltVar",
            "minElev",
            "drLimit",
            "pDop",
            "tDop",
            "pAcc",
            "tAcc",
            "staticHoldThresh",
            "dgnssTimeout",
            "cnoThreshNumSvs",
            "cnoThresh",
            "staticHoldMaxDist",
            "utcStandard"
        ].forEach((field, idx) => {
            if(options[field] !== undefined) {
                throw new MessageSerializationError("Option \"" + field + "\" not yet implemented");
            }
        });
        this.payload = Object.assign({
            dynModel: undefined,
        }, options);
        // this message includes a mask to select which settings are applied.
        // Some are one-to-one with options above, but some apply to multiple
        // options that should be specified together
        this.maskOffsets = {
            dynModel: 0,
            minElev: 1,
            fixMode: 2,
            drLimit: 3,
            pMask: 4,
            tMask: 5,
            staticHoldMask: 6,
            dgpsMask: 7,
            cnoThreshold: 8,
            utc: 10
        };

        this.dynModels = {
            "portable": 0,
            "stationary": 2,
            "pedestrian": 3,
            "automotive": 4,
            "sea": 5,
            "airborn_1g": 6,
            "airborn_2g": 7,
            "airborn_4g": 8,
            "wristwatch": 9
        };
    };

    serializePayload() {
        let pl = this.payload;
        let off = this.maskOffsets;
        let data = Buffer.alloc(36);
        let mask = 0x0000;
        if(pl.dynModel !== undefined) {
            if(!Object.keys(this.dynModels).includes(pl.dynModel)) {
                throw new MessageSerializationError(
                    "Dynmodel \"" + pl.dynModel + "\" not supported. " +
                    "Available models are:\n" + Object.keys(this.dynModels));
            }
            mask |= (1 << off.dynModel);
            data.writeUInt8(this.dynModels[pl.dynModel], 2);
        }
        // TODO: implement other options here
        data.writeUInt16LE(mask, 0);

        return data;
    }
}

module.exports = {
    UbxCfgMessage,
    UbxCfgMsg,
    UbxCfgRate,
    UbxCfgNav5
}
