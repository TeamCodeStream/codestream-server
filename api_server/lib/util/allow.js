'use strict';

var _findAttribute = function(allowedAttributes, attribute) {
	if (allowedAttributes instanceof Array) {
		return allowedAttributes.indexOf(attribute) !== -1;
	}
	else if (typeof allowedAttributes === 'object') {
		let types = Object.keys(allowedAttributes);
		let index = types.findIndex(type => {
			return _findAttribute(allowedAttributes[type], attribute);
		});
		if (index !== -1) {
			return types[index];
		}
		else {
			return false;
		}
	}
};

var _typeMatches = function(value, type) {
	if (['object', 'string', 'number', 'boolean'].indexOf(type) !== -1) {
		return typeof value === type;
	}
	else if (type === 'array') {
		return value instanceof Array;
	}
	else if (type.startsWith('array')) {
		let match = type.match(/^array\((.+)\)$/);
		if (!match) {
			return false;
		}
		return value instanceof Array &&
			!value.find(elem => { return typeof elem !== match[1]; });
	}
	else {
		return false;
	}
};

module.exports = function(object, allowedAttributes) {
	if (typeof object !== 'object') { return; }
	Object.keys(object).forEach(attribute => {
		let type = _findAttribute(allowedAttributes, attribute);
		if (
			type !== true &&
			(
				type === false ||
				!_typeMatches(object[attribute], type)
			)
		) {
			delete object[attribute];
		}
	});
};
