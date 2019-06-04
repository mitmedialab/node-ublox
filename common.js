function toHex(n, pad) {
    let s = n.toString(16);
    if(pad !== undefined) {
        while(s.length < pad) {
            s = "0" + s;
        }
    }
    return s;
}

function parseBitfield(bitfield, options, output) {
    if(output === undefined) {
        output = {};
    }

    for(let key of Object.keys(options)) {
        let arg = options[key];
        if(typeof arg === "number") {
            output[key] = getFlag(bitfield, arg);
        } else if(typeof arg === "object") {
            if(arg.start !== undefined && arg.size !== undefined) {
                output[key] = getSubField(bitfield, arg.start, arg.size);
            } else if(arg.start !== undefined) {
                output[key] = getFlag(bitfield, arg.start);
            }

            if(arg.invert === true) {
                output[key] = !output[key];
            }

            if(arg.enum !== undefined) {
                output[key] = mapEnum(output[key], arg.enum);
            }
        }
    }

    return output;
}

function getFlag(bitfield, index) {
    return ((bitfield & (1<<index)) != 0);
}

function getSubField(bitfield, start, size) {
    let mask = 2**size - 1;
    return (bitfield & (mask<<start)) >> start;
}

function mapEnum(n, values) {
    let v = values[n];
    if(v === undefined) return {val: n};
    return {enum: v, val: n};
}

module.exports = {toHex, parseBitfield, getFlag, getSubField, mapEnum};
