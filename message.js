class GpsMessage {
    static decode(data) {
        let message = new GpsMessage();
        message.data = data;
        return message;
    }

    toString() {
        return "Unknown GPS message: " + this.data.toString();
    }
}

module.exports = GpsMessage;

