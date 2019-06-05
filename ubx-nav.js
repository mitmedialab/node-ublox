const {UbxMessage} = require("./ubx");
const {toHex, parseBitfield, mapEnum} = require("./common");
const {MessageDecodeError} = require("./error");
const {UBX_NAV, UBX_NAV_HPPOSLLH, UBX_NAV_SVIN, UBX_NAV_STATUS,
    UBX_NAV_PVT, UBX_NAV_SAT} = require('./ubx-msgtypes');
const {inspect} = require('util');


class UbxNavMessage extends UbxMessage {
    constructor() {
        super();
        this.messageClass = UBX_NAV;
    }

    static decode(messageId, payload) {
        switch(messageId) {
            case UBX_NAV_HPPOSLLH:
                return UbxNavHPPosLLH.decode(payload);
            case UBX_NAV_SVIN:
                return UbxNavSvin.decode(payload);
            case UBX_NAV_PVT:
                return UbxNavPvt.decode(payload);
            case UBX_NAV_SAT:
                return UbxNavSat.decode(payload);
            default:
                return new UbxNavMessage();
        }

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

//class UbxNavStatus extends UbxNavMessage {
//    constructor(options) {
//        super();
//        this.messageId = UBX_NAV_STATUS;
//        this.payload = Object.assign({
//            iTOW: undefined,
//            gpsFix: undefined,
//            flags: {
//                gpsFixOk: undefined,
//                diffSoln: undefined,
//                wknSet: undefined,
//                towSet: undefined,
//                psmState: undefined,
//                spoofDetState: undefined
//            },
//            fixStat: {
//                diffCor: undefined,
//                mapMatching: undefined
//            },
//            ttff: undefined,
//            msss: undefined
//        }, options);
//    }
//}

class UbxNavPvt extends UbxNavMessage {
    constructor(options) {
        super();
        this.messageId = UBX_NAV_PVT,
        this.payload = Object.assign({
            iTOW: undefined,
            year: undefined,
            month: undefined,
            day: undefined,
            hour: undefined,
            min: undefined,
            sec: undefined,
            valid: {
                date: undefined,
                time: undefined,
                fullyResolved: undefined,
                mag: undefined
            },
            tAcc: undefined,
            nano: undefined,
            fixType: undefined,
            flags: {
                gnssFixOK: undefined,
                diffSoln: undefined,
                headVehValid: undefined,
                carrSoln: undefined,
                confirmedAvai: undefined,
                confirmedDate: undefined,
                confirmedTime: undefined
            },
            numSV: undefined,
            lon: undefined,
            lat: undefined,
            height: undefined,
            hMSL: undefined,
            hAcc: undefined,
            vAcc: undefined,
            velN: undefined,
            velE: undefined,
            gSpeed: undefined,
            headMot: undefined,
            sAcc: undefined,
            pDOP: undefined,
            headVeh: undefined,
            magDec: undefined,
            magAcc: undefined
        }, options);
    }

    static decode(data) {
        if(data.length < 92) {
            throw new MessageDecodeError("Payload too short for UBX-NAV-PVT");
        }
        
        let valid = parseBitfield(data.readUInt8(11), {
            date: 0,
            time: 1,
            fullyResolved: {start: 2, size: 2},
            mag: 4
        });

        let flags = parseBitfield(data.readUInt8(21), {
            gnssFixOK: 0,
            diffSoln: 1,
            psmState: {start: 2, size: 3, enum: ['disabled', 'enabled',
                'acquisition', 'tracking', 'powerOptimizedTracking', 'inactive']},
            headVehValid: 5,
            carrSoln: {start: 6, size: 2, enum: ['none', 'float', 'fixed']}
        });
        parseBitfield(data.readUInt8(22), {
            confirmedAvai: 5,
            confirmedDate: 6,
            confirmedTime: 7
        }, flags);

        let fixType = mapEnum(data.readUInt8(20), ['noFix', 'deadReckoning',
            '2D', '3D', 'gnssWithDeadReckoning', 'timeOnly']);

        return new UbxNavPvt({
            iTOW: data.readUInt32LE(0),
            year: data.readUInt16LE(4),
            month: data.readUInt8(6),
            day: data.readUInt8(7),
            hour: data.readUInt8(8),
            min: data.readUInt8(9),
            sec: data.readUInt8(10),
            valid,
            tAcc: data.readUInt32LE(12),
            nano: data.readInt32LE(16),
            fixType,
            flags,
            numSV: data.readUInt8(23),
            lon: data.readInt32LE(24) * 1e-7,
            lat: data.readInt32LE(28) * 1e-7,
            height: data.readInt32LE(32),
            hMSL: data.readInt32LE(36),
            hAcc: data.readUInt32LE(40),
            vAcc: data.readUInt32LE(44),
            velN: data.readInt32LE(48),
            velE: data.readInt32LE(52),
            velD: data.readInt32LE(56),
            gSpeed: data.readInt32LE(60),
            headMot: data.readInt32LE(64) * 1e-5,
            sAcc: data.readUInt32LE(68),
            headAcc: data.readUInt32LE(72),
            pDOP: data.readUInt16LE(76) * 0.01,
            headVeh: data.readInt32LE(84) * 1e-5,
            magDec: data.readInt16LE(88) * 1e-2,
            magAcc: data.readInt16LE(90) * 1e-2
        });
    }
}

class UbxNavSat extends UbxNavMessage {
    constructor(options) {
        super();
        this.messageId = UBX_NAV_SAT;
        this.payload = Object.assign({
            iTOW: undefined
        }, options);
    }

    static decode(data) {
        if(data.length < 8) {
            throw new MessageDecodeError("Payload too short for UBX-NAV-SAT");
        }

        let numSvs = data.readUInt8(5);
        if(data.length < (8 + 12*numSvs)) {
            throw new MessageDecodeError("Payload too short for UBX-NAV-SAT + SVs");
        }

        function readSv(svData) {
            return {
                gnssId: svData.readUInt8(0),
                svId: svData.readUInt8(1),
                cno: svData.readUInt8(2),
                elev: svData.readInt8(3),
                azim: svData.readInt16LE(4),
                prRes: svData.readInt16LE(6) * 0.1,
                flags: parseBitfield(svData.readUInt32LE(8), {
                    qualityInd: {start: 0, size: 3, enum: ['noSignal', 'searching',
                        'acquired', 'unusable', 'codeLocked', 'codeCarrierLocked',
                        'codeCarrierLocked', 'codeCarrierLocked']},
                    svUsed: 3,
                    health: {start: 4, size: 2, enum: ['unknown', 'healthy', 
                        'unhealthy']},
                    diffCorr: 6,
                    smoothed: 7,
                    orbitSource: {start: 8, size: 3, enum: ['noInfo', 'ephemeris',
                        'almanac', 'assistNowOffline', 'assistNowAutonomous',
                        'other', 'other', 'other']},
                    ephAvail: 11,
                    almAvail: 12,
                    anoAvail: 13,
                    aopAvail: 14,
                    sbasCorrUsed: 16,
                    rtcmCorrUsed: 17,
                    slasCorrUsed: 18,
                    prCorrUsed: 20,
                    crCorrUsed: 21,
                    doCorrUsed: 22
                })
            }
        }

        let svs = [];
        for(let i=0; i<numSvs; i++) {
            svs.push(readSv(data.slice(8+12*i, 8+12*(i+1))));
        }


        return new UbxNavSat({
            iTOW: data.readUInt32LE(0),
            version: data.readUInt8(4),
            numSvs,
            svs
        });

    }
}

module.exports = {
    UbxNavMessage,
    UbxNavHPPosLLH,
    UbxNavSvin,
    UbxNavPvt,
    UbxNavSat
};
