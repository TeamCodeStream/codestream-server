// provide middleware to determine if the requester's company has not yet been migrated
// to the company-centric model, and if not, block the request, return an error code,
// and kick off the migration

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const Errors = require('./errors');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const RestfulErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/errors');
const MigrationHandler = require('./migration_handler');

const DEPENDENCIES = [
	'access_logger'		// we want this logged! (this also has dependency on authenticator and request_id)
];

const ROUTES = [
	{
		method: 'get',
		path: '/no-auth/trigger-migration',
		func: (request, response) => {
			if (request.abortWith) {
				response.status(request.abortWith.status).send(request.abortWith.error);
			} else {
				response.send({});
			}
		} 
	}
];

class CompanyCentricMigration extends APIServerModule {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
		this.errorHandler.add(AuthenticatorErrors);
		this.errorHandler.add(RestfulErrors);
	}

	getDependencies () {
		return DEPENDENCIES;
	}

	getRoutes () {
		return ROUTES;
	}
	
	middlewares () {
		// return a middleware function that will look for any companies the user is in that have not yet
		// been migrated to company-centric, if so, we block the request, return an error code,
		// and kick off the migration
		return async (request, response, next) => {
			// can manually trigger migrations using a secret
			let dryRun, companyId, migrationData, doMerge;
			if (
				request.path.toLowerCase() === '/no-auth/trigger-migration' && 
				request.method.toLowerCase() === 'get'
			) {
				if (encodeURIComponent(request.query.secret || '') !== this.api.config.sharedSecrets.cookie) {
					request.abortWith = {
						status: 401,
						error: this.errorHandler.error('missingAuthorization')
					};
					return next();
				}
				dryRun = !request.query.forReal;
				companyId = request.query.companyId;
				doMerge = !!request.query.doMerge;
				if (!companyId) {
					request.abortWith = {
						status: 401,
						error: this.errorHandler.error('parameterRequired', { info: 'companyId' })
					};
					return next();
				}
			} else {
				// we're ok with no-auth requests, but anything else...
				if (!request.user) {
					return next();
				}

				// check if company-centric migrations have been turned on, only read once a minute
				if (this.lastMigrationCheckTime && Date.now() < this.lastMigrationCheckTime + 60 * 1000) {
					return next();
				}
				migrationData = (await this.api.data.globals.getOneByQuery(
					{ tag: 'companyCentricMigration' }, 
					{ overrideHintRequired: true }
				));
				this.lastMigrationCheckTime = Date.now();
				if (!migrationData || !migrationData.enabled) {
					return next();
				}
				dryRun = !migrationData.forReal;
			}

			const errorCode = await new MigrationHandler({
				api: this.api,
				request,
				dryRun,
				doMerge,
				companyId,
				migrationData
			}).handleMigration();

			// signal an error response as needed
			if (errorCode) {
				if (dryRun && errorCode !== 'notFound') {
					this.api.log('*************************************************************************************');
					this.api.log(`Would have thrown ${errorCode}`);
					this.api.log('*************************************************************************************');
				} else {
					request.abortWith = {
						status: 401,
						error: this.errorHandler.error(errorCode)
					};
					response.set('X-CS-Migration-Error', this.errorHandler.error(errorCode).code);
				}
			} 

			next();
		};
	}
}

module.exports = CompanyCentricMigration;
