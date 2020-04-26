
'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('../codestream-configs/lib/structured_config');

class ServiceConfig {
	/**
	 * 
	 * @param {object} options   - requires one of 'configFile' or 'mongoUrl' properties
	 */
	constructor(options) {
		if (!options.configFile && !options.mongoUrl) {
			throw Error('FATAL: no configuration provided. Set filename or mongourl.');
		}
		this.cfgData = StructuredConfigFactory.create(options);
		this.config = null;
		this.lastConfig = null;
		this.showConfig = false;
		// specify a property in dotted notation for showConfig to set it upon loading
		this.showConfigProperty = options.showConfigProperty;
	}

	// creates a custom config object derived from the loaded native config
	_customizeConfig() {
		throw Error('_customizeConfig() method must be overridden');
	}

	getConfig() {
		return this.config;
	}

	// compare this.config and this.lastConfig to determine if a restart or re-initialization is needed
	restartRequired() {
		return false;
	}

	async loadConfig() {
		if (!this.config) {
			await this.cfgData.initialize();
		}
		else {
			await this.cfgData.loadConfig({ reload: true });
			// remember the previous config so we can determine if a restart is needed
			this.lastConfig = JSON.parse(JSON.stringify(this.config));  // poor-man's deep copy
		}
		this.config = this.cfgData.getCustomConfig(this._customizeConfig);
		if (this.showConfigProperty) {
			this.showConfig = this.cfgData.getProperty(this.showConfigProperty);
		}
		if (this.showConfig) {
			console.log('Config:', JSON.stringify(this.config, undefined, 10));
		}
		return this.config;
	}

	async isDirty() {
		return this.cfgData.isDirty();
	}
}

module.exports = ServiceConfig;
