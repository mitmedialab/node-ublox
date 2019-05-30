const {GpsReceiver, TelnetGpsReceiver} = require('./gps');

module.exports = {
    GpsReceiver,
    TelnetGpsReceiver,
    ack: require('./ubx-ack'),
    cfg: require('./ubx-cfg')
};
