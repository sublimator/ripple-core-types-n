'use strict';

const makeClass = require('../make-class');
const {ensureArrayLikeIs, SerializedType} = require('./serialized-type');
const {Field} = require('../enums');
const {STObject} = require('./st-object');
const {ArrayEndMarker} = Field;

const STArray = makeClass({
  mixin: SerializedType,
  extends: Array,
  static: {
    fromParser(parser) {
      const array = new STArray();
      while (!parser.end()) {
        const field = parser.readField();
        if (field === ArrayEndMarker) {
          break;
        }
        const outer = new STObject();
        outer[field] = parser.readFieldValue(field);
        array.push(outer);
      }
      return array;
    },
    from(value) {
      return ensureArrayLikeIs(STArray, value).withChildren(STObject);
    }
  },
  toJSON() {
    return this.map((v) => v.toJSON());
  },
  toBytesSink(sink) {
    this.forEach(so => so.toBytesSink(sink));
  }
});

module.exports = {
  STArray
};
