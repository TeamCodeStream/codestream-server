// from http://es6-features.org/#ClassInheritanceFromExpressions

module.exports = (base_class, ...mixins) => {
    let base = class __combined extends base_class {
        constructor (...args) {
            super(...args);
         }
    };
    let copy_props = (target, source) => {
        Object.getOwnPropertyNames(source)
            .concat(Object.getOwnPropertySymbols(source))
            .forEach(prop => {
                if (!prop.match(/^(?:constructor|prototype|arguments|caller|name|bind|call|apply|toString|length)$/)) {
                   Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
                }
            });
    };
    mixins.forEach(mixin => {
        copy_props(base.prototype, mixin.prototype);
        copy_props(base, mixin);
    });
    return base;
};
