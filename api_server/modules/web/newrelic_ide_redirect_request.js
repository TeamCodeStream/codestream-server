// handle opening a new relic link in the IDE

'use strict';
const IdeRedirectRequest = require('./ide_redirect_request');
const { defaultCookieName, ides} = require('./config');

class NewRelicIdeRedirectRequest extends IdeRedirectRequest {

	async prepareTemplateProps () {
		this.parsedPayload = {};
		if (this.request.query && this.request.query.payload) {
			try {
				const parsedPayload = JSON.parse(Buffer.from(decodeURI(this.request.query.payload), 'base64').toString('ascii'));
				this.parsedPayload = {...parsedPayload};
			}
			catch(ex) {
				this.api.logger.warn(ex);
			}
		}
		const launcherModel = this.createLauncherModel('');
		this.templateProps = {
			pageType: 'errorsinbox',
			pageWhat: 'ErrorsInbox',
			analyticsContentType: 'Error',
			launchIde: this.parsedPayload.ide === '' ? 'default' : this.parsedPayload.ide,
			queryString: { ide: this.parsedPayload.ide === '' ? 'default' : this.parsedPayload.ide },
			errorGroupGuid: this.parsedPayload.errorGroupGuid,
			newToCodeStream: launcherModel.isMru ? "false" : "true",
			icons: {},
			partial_launcher_model: launcherModel,
			partial_title_model: {},
			segmentKey: this.api.config.telemetry.segment.webToken,
			src: decodeURIComponent(this.parsedPayload.src || ''),
		}

		return true;
	}

	createLauncherModel (repoId) {
		// overwriting the base since the base deals with mongo data
		let environment;
		const { environmentGroup } = this.api.config;
		const { runTimeEnvironment } = this.api.config.sharedGeneral;
		if (environmentGroup && environmentGroup[runTimeEnvironment]) {
			environment = environmentGroup[runTimeEnvironment].shortName;
		}

		const cookieNames = [];
		if (repoId) {
			cookieNames.push(`${defaultCookieName}--${repoId}`);
		}
		cookieNames.push(defaultCookieName);
		const queryStringIDE = this.parsedPayload.ide;
		let autoOpen = !!(!queryStringIDE || queryStringIDE === 'default');

		if (queryStringIDE && queryStringIDE !== 'default') {
			const mappedQueryStringIDE = ides.find(_ => _.moniker === queryStringIDE);
			if (mappedQueryStringIDE) {
				return { ides: ides, lastOrigin: mappedQueryStringIDE, autoOpen: true, isSpecificIde: true };
			}
		}

		const lastOrigin = ((function() {
			for (const cookieName of cookieNames) {
				const cookie = this.request.cookies && this.request.cookies[cookieName];
				if (cookie) {
					const mappedIde = ides.find(_ => _.moniker === cookie);
					if (mappedIde) {
						return { lastOrigin: mappedIde, autoOpen: autoOpen, isMru: true };
					}
				}
			}
			return {
				lastOrigin: ides.find(_ => _.moniker === "vsc"),
				autoOpen: false,
				isMru: false
			}
		}).bind(this))();
		const result = {
			environment,
			ides: ides,
			csrf: this.request.csrfToken(),
			src: decodeURIComponent(this.parsedPayload.src || ''),
			showVideo: true,
			...lastOrigin
		};
		result.isDefaultJetBrains = result.lastOrigin && result.lastOrigin.moniker.indexOf('jb-') === 0;
		return result;
	}
}

module.exports = NewRelicIdeRedirectRequest;
