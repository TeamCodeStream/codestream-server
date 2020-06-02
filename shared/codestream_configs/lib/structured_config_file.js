
'use strict';

const StructuredConfigBase = require('./structured_config_base');
const fs = require('fs');
const hjson = require('hjson');

class StructuredConfigFile extends StructuredConfigBase {
	// load the config data from a file
	async _loadConfig() {
		this.configFile = this.options.configFile || process.env.STRUCTURED_CFG_FILE;
		this.configFileLastModified = fs.statSync(this.configFile).mtime;
		console.log(`loading config from ${this.configFile}`);
		return hjson.parse(fs.readFileSync(this.configFile, 'utf8'));
	}

	/**
	 * @returns {boolean}  	 true if the configuration needs to be reloaded from the source
	 */
	async isDirty() {
		return fs.statSync(this.configFile).time > this.configFileLastModified;
	}
}

module.exports = StructuredConfigFile;
