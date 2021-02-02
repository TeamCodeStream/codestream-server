'use strict';

const util = require('util');
const fs = require('fs');
const hjson = require('hjson');
const StringifySortReplacer = require('../../server_utils/stringify_sort_replacer');

const schemas = {};     // schema cache

const ConfigTypes = {
	base: 'base',
	file: 'file',
	mongo: 'mongo'
};

/* eslint no-console: 0 */
/* eslint no-prototype-builtins: 0 */

// evidentally I need this according to some doc on the interwebs
// for when promises go south
process.on('unhandledRejection', (err) => { 
	console.warn(err);
	process.exit(1);
});


/**
 * @classdesc Manage well-defined application configurations
 * @class
 *
 * @prop {object}  options             - instantiation options
 * @prop {object}  config              - configuration data
 * @prop {object}  schema              - effective schema
 * @prop {string}  configCollection    - effective config collection name
 * @prop {number}  schemaVersion       - effective schema version
 * @prop {string}  schemaFile          - effective schema file path/name
 * @prop {string}  configFile          - effective config file path/name
 */
class StructuredConfigBase {
	/**
	 * Each instance represents a db handle or a single configuration with its schema
	 *
	 * @constructor
	 * @param {object}  [options]                     - instantiation options
	 * @param {string}  [options.showConfigProperty]  - property (bool) to control logging the config
	 * @param {string}  [options.schemaFile]          - override schema file name
	 * @param {string}  [options.mongoUrl]            - when config is stored in mongo
	 * @param {string}  [options.mongoCfgCollection]  - override mongo config collection name
	 * @param {string}  [options.configFile]          - config file name
	 */
	constructor (options = {}) {
		Object.assign(this, {
			options,
			configType: options.configType || ConfigTypes.base,
			showConfig: options.showConfig || false,
			sourceConfig: null,			// active, native configuration as read in from the source
			lastPreferredConfig: null,	// previous configuration (for comparison)
			showConfigProperty: options.showConfigProperty || false,   // for logging the config
			customConfigFunc: options.customConfigFunc,
			customRestartFunc: options.customRestartFunc,
			logger: options.logger || console
		});
	}

	// configTypes() {
	// 	return ConfigTypes;
	// }

	getConfigType() {
		return this.configType;
	}

	configIsFile() {
		return this.configType === ConfigTypes.file;
	}

	configIsMongo() {
		return this.configType === ConfigTypes.mongo;
	}

	// this is meant to be optional but will always be defined
	getConfigMetaDocument() {
		return null;
	}

	// poor-man's debugging
	_dump(o) {
		this.logger.log(util.inspect(o || this, false, null, true /* enable colors */));
	}

	// default derivation of the schema version
	_defaultSchemaVersion () {
		return parseInt(
			this.options.schemaVersion || process.env.STRUCTURED_CFG_SCHEMA_VERSION || fs.readFileSync(__dirname + '/../parameters.version', 'utf8').split('\n')[0],
			10);
	}

	/**
	 * Initialize the config file object; establish connections to any storage services
	 * 
	 * @param {object}  [initOptions]              - initialization options
	 * @param {boolean} [initOptions.connectOnly]  - true will connect to mongo only
	 */
	async initialize(initOptions = {}) {
		if (!initOptions.connectOnly) {
			await this.loadConfig();
		}
	}

	/**
	 * load the configuration data
	 * 
	 * @param {object}  [loadOptions]           - options for loading
	 * @param {boolean} [loadOptions.reload]    - true to force a reload of the config data
	 */
	async _loadConfig () {
		throw Error('_loadConfig() must be overloaded');
	}

	// custom config if applicable, otherwise native
	getPreferredConfig () {
		let nativeConfig = this.getSection();
		return this.customConfigFunc ? this.customConfigFunc(nativeConfig) : nativeConfig;
	}

	// synonym for clarity
	getNativeConfig () {
		return this.getSection();
	}

	_sleep(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
 
	/**
	 * return config data to the caller. Will initialize, load schema and evaluate
	 * custom config function if need be.
	 */
	async loadConfig (loadOptions = {}) {
		if (!loadOptions.reload && this.sourceConfig) {
			return loadOptions.custom ? this.getPreferredConfig() : this.getNativeConfig();
		}
		if (!this.sourceConfig) {
			await this.initialize({connectOnly: true});
			await this._loadSchemaFromFile();
		}
		else {
			// remember the previous config so we can determine if a restart is needed
			this.lastPreferredConfig = JSON.parse(JSON.stringify(this.getPreferredConfig()));  // poor-man's deep copy
		}
		let newCfg;
		if (this.options.wait || loadOptions.wait) {
			this.logger.log('loading indefinitely...');
			while (!newCfg) {
				newCfg = await this._loadConfig(loadOptions);
				if (!newCfg) {
					this.logger.log(`Retrying in 5s...`);
					await this._sleep(5000);
				} else {
					this.logger.log(`config loaded`);
				}
			}
		} else {
			// console.log('calling _loadConfig once...');
			newCfg = await this._loadConfig(loadOptions);
		}
		if (newCfg) {
			this.sourceConfig = newCfg;
			if (this.showConfigProperty) {
				this.showConfig = this.getProperty(this.showConfigProperty);
			}
			if (this.showConfig) {
				this.logger.log(
					'Config:',
					JSON.stringify(this.getPreferredConfig(), StringifySortReplacer, 4)
				);
			}
		} else if (!this.options.wait) {
			this.logger.error('_loadConfig() failed', loadOptions);
			return;
		}
		return loadOptions.custom ? this.getPreferredConfig() : this.getNativeConfig();
	}

	// present a consistent interface for working with the preferred config
	async loadPreferredConfig(loadOptions = {}) {
		return await this.loadConfig({ ...loadOptions, custom: true });
	}

	/**
	 * @returns {boolean}  	 true if the configuration needs to be reloaded from the source
	 */
	async isDirty () {
		throw Error('isDirty() must be overloaded');
	}

	// the restart function is used by the app to deal with restart related
	// issues that might come up when refreshing a configuration. It can
	// return any type and will only be referenced by the app.
	restartRequired () {
		if (this.customRestartFunc) {
			return this.customRestartFunc(
				this.lastPreferredConfig,
				this.getPreferredConfig()
			);
		}
		return false;
	}

	// load the schema from the source tree along with the schema version
	async _loadSchemaFromFile() {
		// you should not reload the schema - consider it part of the source code
		if (this.schema) {
			return;
		}
		this.schemaFile = this.options.schemaFile || process.env.STRUCTURED_CFG_SCHEMA_FILE || __dirname + '/../parameters.json';
		if (!schemas.hasOwnProperty(this.schemaFile)) {
			this.logger.log(`loading schema (${this.schemaFile})`);
			schemas[this.schemaFile] = hjson.parse(fs.readFileSync(this.schemaFile, 'utf8'));
		}
		this.schema = schemas[this.schemaFile];
		this.schemaVersion = this._defaultSchemaVersion();
	}

	/**
	 * @returns {number}  The effective schema version
	 */
	getSchemaVersion() {
		return this.schemaVersion;
	}

	// return a section of config or schema
	_getSection(p, section) {
		if (!section) {
			return p;
		}
		let propList = section.split('.');
		// this.logger.log(propList);
		if (propList[0] === '') {
			return p;
		}
		for(let prop of propList) {
			// this.logger.log(`_getSection() processing ${prop}`);
			// this.logger.log(util.inspect(p, false, null, true /* enable colors */));
			if(p[prop]) {
				p = p[prop];
			}
			else if (this._isRepeatingBlockKey(p)) {
				// this is a repeating block which means 'p' is a schema and therefore
				// we're done traversing the tree.
				// FIXME: This could be problematic if we're digging to a sub-structure in a repeating block.
				let repeatingBlockKey = Object.keys(p)[0];
				// this.logger.log(`repeating block for prop ${prop} with key = ${repeatingBlockKey}`);
				return p[repeatingBlockKey];
			}
			else {
				// this.logger.error(`property ${prop} not found`);
				return;
			}
		}
		// this.logger.log('_getSection() is done');
		return p;
	}

	// from eric - so we can interpolate variables in string props of the config file
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
			// this.logger.log(`overriding config value for ${prop} from ${schema[prop]['env']}`);
			return process.env[ schema[prop]['env'] ];
		}
		if (data.hasOwnProperty(prop)) {
			return data[prop];
		}
		if(schema[prop].hasOwnProperty('default')) {
			// this.logger.log(`using default config value for ${prop}`);
			return this._interpolate(schema[prop]['default'], process.env);
		}
		// this.logger.warn(`property ${prop} does not have a value nor a default (it is undefined)`);
		return;
	}

	// for config blocks that repeat (each has a unique key). Return the key
	// or null if it isn't a repeating block.
	_isRepeatingBlockKey(schema) {
		if (!schema) {
			return;
		}
		let propList = Object.keys(schema);
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
		// this.logger.log('------------\nschema:', schema);
		// this.logger.log('data:', data);
		let blockKey = this._isRepeatingBlockKey(schema);
		for (let prop of Object.keys(data)) {
			// this.logger.log('prop', prop);
			let schemaProp = blockKey ? blockKey : prop;
			// this.logger.log('schemaProp =', schemaProp);
			if (schema[schemaProp].hasOwnProperty('desc')) {
				// this.logger.log(`leaf node at prop ${prop} -> ${sectionData[prop]}`);
				sectionData[prop] = this._getConfigValue(prop, schema, data);
				if (typeof(sectionData[prop]) == 'string') {
					// this.logger.log(`-- ${sectionData[prop]}`);
					sectionData[prop] = this._interpolate(sectionData[prop], process.env);
				}
			}
			else {
				sectionData[prop] = {};
				this._buildSection(sectionData[prop], schema[schemaProp], data[prop]);
			}
		}
	}

	/**
	 * Returns section of the configuration file
	 * 
	 * @param {string} section   - dotted notation to get the section (must refer to a block)
	 * 
	 * @returns {object}   section of the config file
	 */
	getSection(section = '') {
		// this.logger.log(util.inspect(section, false, null, true /* enable colors */));
		let schema = this._getSection(this.schema, section);
		let data = this._getSection(this.sourceConfig, section);
		let sectionData = {};
		this._buildSection(sectionData, schema, data);
		return sectionData;
	}

	/**
	 * returns a property (leaf) of the config file
	 * 
	 * @param {object} propString   - dotted notation of property
	 */
	getProperty(propString) {
		let propList = propString.split('.');
		let property = propList.slice(propList.length - 1);
		let section = propList.slice(0, propList.length - 1).join('.');
		let schema = this._getSection(this.schema, section);
		let data = this._getSection(this.sourceConfig, section);
		let sectionData = {};
		this._buildSection(sectionData, schema, data);
		return sectionData[property];
	}
}
module.exports = StructuredConfigBase;
