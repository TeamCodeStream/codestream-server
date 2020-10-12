
// we really need typescript
const validationFields = {
	minLength: 0,
	maxLength: 0,
	minValue: 0,
	maxValue: 0,
	isRequired: true,
	isHostName: true,
	isMongoUrl: true,
}

const stringLength = (i, fv) => {
	if (fv.minLength && i.length < fv.minLength) return 'string is too short.';
	if (fv.maxLength && i.length > fv.maxLength) return 'string is too long.';
}

const numRange = (i, fv) => {
	if (!isNaN(fv.minValue) && i < fv.minValue) return `number must be greater than ${fv.minValue} chars.`;
	if (!isNaN(fv.maxValue) && i > fv.maxValue) return `number must be less than ${fv.maxValue} chars.`;
}

const hostName = (i, fv) => {
	if (!/^[a-z][\w\-\.]+$/i.test(i)) return 'this does not look like a hostname.';
}

const mongoUrl = (i) => {
	console.debug('**** validating', i);
	if (!/^mongodb:\/\//i.test(i)) return 'this does not look like a mongodb url.';
}

const ValidationsByType = {
	text: [stringLength],
	number: [numRange],
};

export function validateInput(input, field) {
	console.debug('**** validateInput()', input, field);
	const fv = field.validation;	
	let msg;
	if (fv.isRequired && !input) return 'input field is required';
	if (!fv.isRequired && !input) return;
	if (fv.isMongoUrl) return mongoUrl(input);
	if (fv.isHostName) return hostName(input);
	// FIXME: getting 'validationFunc is not a function' error
	// ValidationsByType[field.type].forEach((validationFunc) => {
	// 	// FIXME: leave a field as invalid, then return focus to it.
	// 	// validationFunc shows up as undefined. WTF.
	// 	console.debug(`fieldtype: ${field.type} validationFunc = `, validationFunc);
	// 	if (msg = validationFunc(input, field.validation)()) return msg;
	// });
	if (field.type === 'text') {
		if (msg = stringLength(input, fv)) return msg;
	}
	else if (field.type === 'number') {
		if (msg = numRange(input, fv)) return msg;
	}
}
