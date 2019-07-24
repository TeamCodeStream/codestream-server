
'use strict';

const util = require('util')
const fs = require('fs');
const hjson = require('hjson');

const schemas = {};
const configs = {};

/*
	options:
		schemaFile: path/name of the schema file
		configFile: path/name of the config file
*/
class StructuredConfigFile {
	constructor (options = {}) {
		this.schemaFileName = options.schemaFile || process.env.CSSVC_CFG_SCHEMA_FILE || __dirname + '/../parameters.json';
		this.configFileName = options.configFile || process.env.CSSVC_CFG_FILE;
		if (!schemas.hasOwnProperty(this.schemaFileName)) {
			console.log(`loading schema (${this.schemaFileName})`);
			schemas[this.schemaFileName] = hjson.parse(fs.readFileSync(this.schemaFileName, 'utf8'));
		}
		this.schema = schemas[this.schemaFileName];
		if (!configs.hasOwnProperty(this.configFileName)) {
			console.log(`loading config (${this.configFileName})`);
			configs[this.configFileName] = hjson.parse(fs.readFileSync(this.configFileName, 'utf8'));
		}
		this.config = hjson.parse(fs.readFileSync(this.configFileName, 'utf8'));
	}

	_dump() {
		console.log(util.inspect(this, false, null, true /* enable colors */))
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

	_mongoUrlParse(mongoUrl) {
		let parsed = mongoUrl.match(/^mongodb:\/\/([^\/]+)\/([^?]+?)((\?)(.+))?$/);
		const results = {
			serversAuthString: parsed[1],
			user: null,
			pass: null,
			servers: [],
			database: parsed[2],
			optionsString: parsed[5],
			options: {}
		};
		parsed = results.serversAuthString.match(/^(([^:]+)(:(.+))?@)?(.+)$/);
		results.user = parsed[2];
		results.pass = parsed[4];
		results.serverList = parsed[5];
		results.serverList.split(',').forEach(function (serverAndPort) {
			let parts = serverAndPort.split(':');
			results.servers.push({
				host: parts[0],
				port: parts[1] || 27017
			})
		});
		if (results.optionsString) {
			results.optionsString.split('&').forEach(function(optionAssignment) {
				let optionPair = optionAssignment.split('=');
				results.options[optionPair[0]] = optionPair[1];
			});
		}
		return results;
	}

	_interpolate(template, context) {
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

	// logic to determine a variable's value by checking the environment variable
	// and applying a default if need be.
	_getConfigValue(prop, schema, data) {
		if (schema[prop].hasOwnProperty('env') && process.env[ schema[prop]['env'] ]) {
			// console.log(`overriding config value for ${prop} from ${schema[prop]['env']}`);
			return process.env[ schema[prop]['env'] ];
		}
		if (data.hasOwnProperty(prop)) {
			return data[prop];
		}
		if(schema[prop].hasOwnProperty('default')) {
			// console.log(`using default config value for ${prop}`);
			return this._interpolate(schema[prop]['default'], process.env);
		}
		// console.warn(`property ${prop} does not have a value nor a default (it is undefined)`);
		return;
	}

	_isRepeatingBlockKey(schema) {
		if (!schema) {
			return;
		}
		let propList = Object.keys(schema)
		if (propList.length == 1 && propList[0].startsWith('<') && propList[0].endsWith('>')) {
			return propList[0];
		}
		return;
	}

	// recursively build the sectionData from the configuration data & schema
	_buildSection(sectionData, schema, data) {
		if (!data) {
			return;
		}
		// console.log('------------\nschema:', schema);
		// console.log('data:', data);
		let blockKey = this._isRepeatingBlockKey(schema);
		for (let prop of Object.keys(data)) {
			// console.log('prop', prop);
			let schemaProp = blockKey ? blockKey : prop;
			// console.log('schemaProp =', schemaProp);
			if (schema[schemaProp].hasOwnProperty('desc')) {
				// console.log(`leaf node at prop ${prop} -> ${sectionData[prop]}`);
				sectionData[prop] = this._getConfigValue(prop, schema, data);
				if (typeof(sectionData[prop]) == 'string') {
					// console.log(`-- ${sectionData[prop]}`);
					sectionData[prop] = this._interpolate(sectionData[prop], process.env);
				}
			}
			else {
				sectionData[prop] = {};
				this._buildSection(sectionData[prop], schema[schemaProp], data[prop]);
			}
		}
	}

	// public method to get a fully populated section of the configuration file
	getSection(section = '') {
		// console.log(`>>>>>>>>>>>>>>>>> GET SECTION ${section}`);
		let schema = this._getSection(this.schema, section);
		let data = this._getSection(this.config, section);
		let sectionData = {};
		this._buildSection(sectionData, schema, data);
		return sectionData;
	}

	// public method to get a fully populated section of the configuration file
	getProperty(propString) {
		let propList = propString.split('.');
		let property = propList.slice(propList.length - 1);
		let section = propList.slice(0, propList.length - 1).join('.');
		let schema = this._getSection(this.schema, section);
		let data = this._getSection(this.config, section);
		let sectionData = {};
		this._buildSection(sectionData, schema, data);
		return sectionData[property];
	}
}

module.exports = StructuredConfigFile;
