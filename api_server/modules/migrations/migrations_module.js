// provide a module to handle database migrations

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const MigrationsHelper = require('./migrations_helper');

class MigrationsModule extends APIServerModule { 

	// initialize the module
	async initialize () {
		// only the first worker brought to life will do migrations
		if (!this.api.amFirstWorker) {
			return;
		}

		// we don't do automatic migrations in production
		const runTimeEnvironment = this.api.config.api.runTimeEnvironment;
		if (runTimeEnvironment.match(/^(prod|qa)$/i)) {
			this.api.log('NOTE: Not doing automatic migrations, this is the cloud production environment');
			return;
		}

		await new MigrationsHelper({
			data: this.api.data,
			logger: this.api
		}).runMigrations();
	}
}

module.exports = MigrationsModule;
