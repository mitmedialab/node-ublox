function toHex(n, pad) {
    let s = n.toString(16);
    if(pad !== undefined) {
        while(s.length < pad) {
            s = "0" + s;
        }
    }
    return s;
}

module.exports = {toHex};
