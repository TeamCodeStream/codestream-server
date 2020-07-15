// all handling for server-served web pages should be handled through here

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const Handlebars = require('handlebars');
const Glob = require('glob-promise');
const FS = require('fs');
const Path = require('path');
const AwaitUtils = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

const STANDARD_PAGES = [
	/*
	// example standard page
	{
		route: 'web/example',
		template: 'example'
	},
	*/
	{
		route: 'web/unfollow-complete',
		template: 'unfollow_complete'
	},
	{
		route: 'web/unfollow-review-complete',
		template: 'unfollow_review_complete'
	},
	{
		route: 'web/confirm-email-complete',
		template: 'email_confirmed'
	}
];

const ROUTES = [
	{
		method: 'get',
		path: 'web/404',
		requestClass: require('./web_404_request')
	},
	{
		method: 'get',
		path: 'web/user/password/reset/invalid',
		requestClass: require('./password_reset_invalid')
	},
	{
		method: 'get',
		path: 'web/user/password/updated',
		requestClass: require('./password_updated_request')
	},
	{
		method: 'get',
		path: 'web/finish',
		requestClass: require('./web_finish_request')
	},
	{
		method: 'get',
		path: 'web/user/password',
		requestClass: require('./web_set_password_request')
	},
	{
		method: 'post',
		path: 'web/user/password',
		requestClass: require('./set_password_request')
	},
	{
		method: 'get',
		path: 'web/assign/team',
		requestClass: require('./web_assign_team_request')
	},
	{
		method: 'post',
		path: 'web/assign/team',
		requestClass: require('./assign_team_request')
	},
	{
		method: 'get',
		path: 'web/login',
		requestClass: require('./web_login_request')
	},
	{
		method: 'post',
		path: 'web/signin',
		requestClass: require('./web_signin_request')
	},
	{
		method: 'get',
		path: 'web/logout',
		requestClass: require('./web_logout_request')
	},
	{
		method: 'get',
		path: 'web/provider-auth/:provider',
		requestClass: require('./web_provider_auth_request')
	},
	{
		method: 'get',
		path: 'web/provider-auth-complete/:provider',
		requestClass: require('./web_provider_auth_complete_request')
	},
	{
		method: 'get',
		path: 'web/error',
		requestClass: require('./web_error_request')
	},
	{
		method: 'get',
		path: 'web/ext/:navigate',
		requestClass: require('./link_ext_navigate_request')
	},
	{
		method: 'get',
		path: 'no-auth/web/error',
		requestClass: require('./web_error_request')
	},
	{
		method: 'get',
		path: 'r/:teamId/:id',
		requestClass: require('./link_review_request')
	},
	{
		method: 'get',
		path: 'c/:teamId/:id',
		requestClass: require('./link_codemark_request')
	},
	{
		method: 'get',
		path: 'p/:teamId/:id',
		requestClass: require('./link_codemark_request')
	},
	{
		method: 'get',
		path: 'web/unfollow-error',
		requestClass: require('./web_unfollow_error_request')
	},
	{
		method: 'get',
		path: 'web/unfollow-review-error',
		requestClass: require('./web_unfollow_review_error_request')
	},
	{
		method: 'get',
		path: 'web/confirm-email',
		requestClass: require('./confirm_email_request')
	},
	{
		method: 'get',
		path: 'web/confirm-email-error',
		requestClass: require('./web_confirm_email_failed_request')
	},
	{
		method: 'post',
		path: 'web/ide/mru',
		requestClass: require('./set_ide_mru_request')
	},
	{
		method: 'get',
		path: 'no-auth/web/styles/web.css',
		requestClass: require('./web_style')
	},
	{
		method: 'get',
		path: 'web/configure-okta',
		requestClass: require('./web_configure_okta_request')
	},
	{
		method: 'get',
		path: 'robots.txt',
		requestClass: require('./web_robots_request')
	},
	{
		method: 'get',
		path: 'web/subscription/upgrade/:companyId',
		requestClass: require('./web_subscription_upgrade_request')
	},
	{
		method: 'get',
		path: 'web/subscription/checkout',
		requestClass: require('./web_subscription_checkout_request')
	},
	{
		method: 'get',
		path: 'web/subscription/thankyou/:companyId',
		requestClass: require('./web_subscription_thankyou_request')
	},
	{
		method: 'get',
		path: 'web/subscription/error',
		requestClass: require('./subscription_error_request')
	}
];

class Web extends APIServerModule {

	getRoutes() {
		return ROUTES.concat(
			STANDARD_PAGES.map(page => {
				return {
					method: 'get',
					path: page.route,
					requestClass: require('./standard_page_request'),
					initializers: { template: page.template }
				};
			})
		);
	}

	async initialize() {
		this.templates = {};

		let files;
		try {
			files = await Glob(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/templates/*.hbs');
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to read web module template directory: ${message}`);
			return;
		}
		await Promise.all(files.map(async file => {
			await this.readAndCompileTemplate(file);
		}));

		Handlebars.registerHelper('toJSON', function(obj) {
			return JSON.stringify(obj);
		});

		// Not in use, but might be useful in the future
		/**
		 * Format string with data
		 * argument[0] "fo{0}ar{1}" (the string with the replacement)
		 * argument[1] "ob"
		 * argument[2] "666"
		 * returns "foobar666"
		 */
		// Handlebars.registerHelper('formatWith', function() {
		// 	try {
		// 		if (!arguments) return undefined;
		// 		var str = arguments[0];
		// 		for (let i = 1; i < arguments.length; i++) {					
		// 			str = str.replace(new RegExp('\\{' + [i - 1] + '\\}', "g"), arguments[i]);
		// 		}
		// 		return str;
		// 	}
		// 	catch (x) {
		// 		return undefined;
		// 	}
		// });

		await this.readVersionInfo();
		await this.readStylesheet();
		await this.readRobots();
	}

	async readAndCompileTemplate(file) {
		let contents;
		try {
			contents = await AwaitUtils.callbackWrap(FS.readFile, file, 'utf8');
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to read template file ${file}: ${message}`);
			return;
		}

		const name = Path.basename(file, '.hbs');
		try {
			if (name.indexOf('partial_') === 0) {
				this.templates[name] = Handlebars.registerPartial(name, contents);
			}
			else {
				this.templates[name] = Handlebars.compile(contents);
			}
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to compile template file ${file}: ${message}`);
		}
	}

	evalTemplateNoSend(name, data = {}) {
		const template = this.templates[name];
		if (!template) return;
		return template(data);
	}

	evalTemplate(request, name, data = {}) {
		const html = this.evalTemplateNoSend(name, data);
		if (!html) {
			this.api.warn(`Could not fulfill request, no template for ${name}`);
			request.response.send(500);
			request.responseIssued = true;
		}
		else {
			request.response.send(html);
			request.responseHandled = true;
		}
	}

	versionInfo() {
		if (this._versionInfo) return this._versionInfo;

		return new Date().getTime();
	}

	async readVersionInfo() {
		try {
			const path = process.env.CSSVC_BACKEND_ROOT + '/api_server/api-server.info';
			if (!FS.existsSync(path)) return;

			const apiServerInfo = FS.readFileSync(path);
			if (!apiServerInfo) return;

			const data = JSON.parse(apiServerInfo);
			if (!data) return;

			this._versionInfo = data.version + data.buildNumber;
		}
		catch (err) {
			return;
		}
	}

	readStylesheet() {
		try {
			this.stylesheet = FS.readFileSync(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/styles/web.css', 'utf8');
		}
		catch (error) {
			return;
		}
	}

	getStylesheet() {
		return this.stylesheet;
	}

	readRobots() {
		try {
			this.robots = FS.readFileSync(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/etc/robots.txt', 'utf8');
		}
		catch (error) {
			return;
		}
	}

	getRobots() {
		return this.robots;
	}
}

module.exports = Web;
