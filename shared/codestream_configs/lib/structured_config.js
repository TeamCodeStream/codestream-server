
'use strict';

const fs = require('fs');
const hjson = require('hjson');

/*
	options:
		schemaFile: path/name of the schema file
		configFile: path/name of the config file
*/
class StructuredConfigFile {
	constructor (options = {}) {
		this.schemaFileName = options.schemaFile || process.env.CSSVC_CFG_SCHEMA_FILE;
		this.configFileName = options.configFile || process.env.CSSVC_CFG_FILE;
		this.schema = hjson.parse(fs.readFileSync(this.schemaFileName, 'utf8'));
		this.config = hjson.parse(fs.readFileSync(this.configFileName, 'utf8'));
	}

	dump() {
		console.log(this);
	}

	_getSection(p, section) {
		let propList = section.split('.');
		// console.log(propList);
		if (propList[0] === '') {
			return p;
		}
		for(let prop of propList) {
			if(p[prop]) {
				p = p[prop];
			}
			else {
				// console.error(`property ${prop} not found`);
				return;
			}
			// console.log(prop);
		}
		// console.log(p);
		return p;
	}

	_interpolate(template, context) {
		if (!template) {
			return template;
		}
		const TokenSanitizeRegex = /\$\{(?:\W*)?(\w*?)(?:[\W\d]*)\}/g;
		if (context === undefined) {
			return template.replace(TokenSanitizeRegex, '');
		}
		template = template.replace(TokenSanitizeRegex, '$${this.$1}');
		return new Function(`return \`${template}\`;`).call(context);
	}

	// logic to determine a variable's value by checking the environment variable
	// and applying a default if need be.
	_getConfigValue(prop, schema, data) {
		if (schema[prop].hasOwnProperty('env') && process.env[ schema[prop]['env'] ]) {
			// console.log(`overriding config value for ${prop} from ${schema[prop]['env']}`);
			return process.env[ schema[prop]['env'] ];
		}
		if(data[prop]) {
			return data[prop];
		}
		if(schema[prop].hasOwnProperty('default')) {
			// console.log(`using default config value for ${prop}`);
			return this._interpolate(schema[prop]['default'], process.env);
		}
		// console.warn(`property ${prop} does not have a value nor a default (it is undefined)`);
		return;
	}

	// recursively build the sectionData from the configuration data & schema
	_buildSection(sectionData, schema, data) {
		for (let prop of Object.keys(schema)) {
			if (schema[prop].hasOwnProperty('desc')) {
				// leaf node
				sectionData[prop] = this._getConfigValue(prop, schema, data);
			}
			else {
				sectionData[prop] = {};
				this._buildSection(sectionData[prop], schema[prop], data[prop]);
			}
		}
	}

	// public method to get a fully populated section of the configuration file
	getSection(section = '') {
		let schema = this._getSection(this.schema, section);
		let data = this._getSection(this.config, section);
		let sectionData = {};
		this._buildSection(sectionData, schema, data);
		return sectionData;
	}
}

module.exports = StructuredConfigFile;
