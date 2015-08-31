'use strict';

const _ = require('lodash');
const makeClass = require('../make-class');
const {slice} = require('../bytes-utils');
const {Hash160} = require('./hash-160');
const ISO_REGEX = /^[A-Z0-9]{3}$/;
const HEX_REGEX = /^[A-F0-9]{40}$/;

function isoToBytes(iso) {
  const bytes = new Uint8Array(20);
  const isoBytes = iso.split('').map(c => c.charCodeAt(0));
  bytes.set(isoBytes, 12);
  return bytes;
}

function isISOCode(val) {
  return _.isString(val) && val.length === 3 && val.match(ISO_REGEX);
}

function isHex(val) {
  return _.isString(val) && val.match(HEX_REGEX);
}

const $uper = Hash160.prototype;
const Currency = makeClass({
  extends: Hash160,
  getters: ['isNative', 'iso'],
  Currency(bytes) {
    Hash160.call(this, bytes);
    this.classify();
  },
  static: {
    from(val) {
      if (val instanceof this) {
        return val;
      }
      const bytes = isISOCode(val) ? isoToBytes(val) :
                    isHex(val) ? val :
                    null;
      if (bytes) {
        return new this(bytes);
      }
      throw new Error(`value ${val} unsupported`);
    }
  },
  classify() {
    // We only have a non null iso() property available if the currency can be
    // losslessly represented by the 3 letter iso code. Otherwise we use iso.
    let onlyISO = true;

    const bytes = this._bytes;
    const code = slice(this._bytes, 12, 15, Array);
    const iso = code.map(c => String.fromCharCode(c)).join('');

    for (let i = bytes.length - 1; i >= 0; i--) {
      if (bytes[i] !== 0 && !(i === 12 || i === 13 || i === 14)) {
        onlyISO = false;
        break;
      }
    }
    const lossLessISO = onlyISO && iso !== 'XRP' && iso.match(ISO_REGEX);
    this._isNative = onlyISO && _.isEqual(code, [0, 0, 0]);
    this._iso = this._isNative ? 'XRP' : lossLessISO ? iso : null;
  },
  toJSON() {
    if (this.iso()) {
      return this.iso();
    }
    return $uper.toJSON.call(this);
  }
});

Currency.XRP = new Currency(new Uint8Array(20));
module.exports = {
  Currency
};
