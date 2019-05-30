const {NmeaMessage} = require("./nmea");
const {Rtcm3Message} = require("./rtcm");
const {UbxMessage} = require("./ubx");
const GpsMessage = require("./message");


function decodeMessage(data) {
    try {
        if(NmeaMessage.identify(data)) {
            return NmeaMessage.decode(data);
        } else if(Rtcm3Message.identify(data)) {
            return Rtcm3Message.decode(data);
        } else if(UbxMessage.identify(data)) {
            return UbxMessage.decode(data);
        } else {
            return GpsMessage.decode(data);
        }
    } catch(e) {
        console.log("Message decode error: %s", e.toString());
        throw e;
        return null;
    }
}

module.exports = decodeMessage;
