// multiple inheritance algorithm
// from http://es6-features.org/#ClassInheritanceFromExpressions

'use strict';

module.exports = (baseClass, ...mixins) => {
	let base = class __combined extends baseClass {
		constructor (...args) {
			super(...args);
		}
	};
	let copyProps = (target, source) => {
		Object.getOwnPropertyNames(source)
			.concat(Object.getOwnPropertySymbols(source))
			.forEach(prop => {
				if (!prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) {
					Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
				}
			});
	};
	mixins.forEach(mixin => {
		copyProps(base.prototype, mixin.prototype);
		copyProps(base, mixin);
	});
	return base;
};
