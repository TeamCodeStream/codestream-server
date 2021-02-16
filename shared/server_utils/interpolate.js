
// template   a string to be interpolated.           'this is my ${ENV_VAR_NAME} setting'
// context    object containing the values to use:   process.env    // process.env.ENV_VAR_NAME="nifty"
// returns    interpolated string:                   'this is my nifty setting'

function interpolate(template, context=null) {
	if (!context) {
		context = process.env;
	}
	if (!template || typeof(template) != 'string' ) {
		return template;
	}
	const TokenSanitizeRegex = /\$\{(?:\W*)?(\w*?)(?:[\W\d]*)\}/g;
	if (context === undefined) {
		return template.replace(TokenSanitizeRegex, '');
	}
	template = template.replace(TokenSanitizeRegex, '$${this.$1}');
	return new Function(`return \`${template}\`;`).call(context);
}

module.exports = interpolate;
