// mongo configuration

'use strict';

// FIXME / DELETEME

// This is here because there are places in the code where the config is
// dynically updated and that isn't allowed for configs managed with the
// structured config module.
//
// This works around that by creating a writable copy of the structured config's
// read-only representation, and maintaining it globally. The bad part is that
// it creates a second global copy of the config; this one, and the one
// accessible by requiring /config/config.js (which will not get any writes to
// it).
//
// It would be better if we didn't ever write to the config!

const ApiConfig = require('./config');

class WritableConfig {
	constructor() {
		this.writableConfig = null;
	}
	async loadConfig(options) {
		if (!this.writableConfig) {
			this.writableConfig = JSON.parse(JSON.stringify(await ApiConfig.loadConfig(options)));  // poor-man's deep copy
		}
		// console.log('writable returning', this.writableConfig);
		// process.exit(1);
		return this.writableConfig;
	}
	getConfig() {
		if (!this.writableConfig) {
			this.writableConfig = JSON.parse(JSON.stringify(ApiConfig.getPreferredConfig()));  // poor-man's deep copy
		}
		return this.writableConfig;
	}
}

module.exports = new WritableConfig();
