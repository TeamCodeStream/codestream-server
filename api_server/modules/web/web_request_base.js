/*eslint complexity: ["error", 30]*/
'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const Partials = require('./partials');
const { defaultCookieName, ides, lastOriginToIdeMonikers } = require('./config');

class WebRequestBase extends RestfulRequest {
	constructor (options) {
		super(options);
	}

	async render (templateName, viewModel) {
		if (!templateName) throw 'templateName is required';

		viewModel = viewModel || {};
		const partials = new Partials(this.data);

		this.module.evalTemplate(this, templateName, Object.assign(viewModel, {
			partial_menu_model: await partials.getMenu(this.user, viewModel.teamName),
			partial_html_head_model: {
				version: this.module.versionInfo()
			}
		}));
	}

	/**
	 * creates the data that the launcher UI requires
	 *
	 * @param {*} repoId
	 * @returns
	 * @memberof WebRequestBase
	 */
	createLauncherModel (repoId) {
		let result = {
			csrf: this.request.csrfToken(),
			ides: ides,
			src: decodeURIComponent(this.request.query.src || ''),
			// some entities may have >1 repoId, we can only use it if there's a unique one
			uniqueRepoId: repoId,
			...this.getLastIde(repoId, [this.user, this.creator].filter(Boolean).map(_ => {
				return {
					lastOrigin: _.get('lastOrigin'),
					lastOriginDetail: _.get('lastOriginDetail'),
				};
			}))
		};
		result.isDefaultJetBrains = result.lastOrigin && result.lastOrigin.moniker.indexOf('jb-') === 0;
		return result;
	}

	decodeLinkId (linkId, pad) {
		linkId = linkId.replace(/-/g, '+').replace(/_/g, '/');
		const padding = '='.repeat(pad);
		linkId = `${linkId}${padding}`;
		return Buffer.from(linkId, 'base64').toString('hex');
	}

	/**
	 * Gets the best IDE by checking:
	 * 0) Check the queryString for a specific moniker
	 * 1) Checks cookie for a repo-based cookie (if we have a repoId) OR the generic MRU cookie 
	 * (either of these mean the user has picked that IDE in the past from the UI)
	 * 2) Check an array of users. user[0] should be the user viewing the page, while
	 * user[1] should be the creator of the codemark/review/entity. 
	 * We use the lastOriginDetail of the user object for this. While team usage of IDEs differ, 
	 * using the creator's IDE _might_ be a better educated guess -- in this case
	 * we don't autoOpen the ide, because we may be wrong, but we pre-select it instead.
	 * 3) If we haven't found an IDE, default to VS Code, but don't autoOpen it
	 *
	 * @param {*} repoId
	 * @param {*} users
	 * @returns
	 * @memberof WebRequestBase
	 */
	getLastIde (repoId, users) {
		try {
			const queryStringIDE = this.request.query && this.request.query.ide;
			let autoOpen = !!(!queryStringIDE || queryStringIDE === 'default');

			if (queryStringIDE && queryStringIDE !== 'default') {
				const mappedQueryStringIDE = ides.find(_ => _.moniker === queryStringIDE);
				if (mappedQueryStringIDE) {
					return { lastOrigin: mappedQueryStringIDE, autoOpen: true, isSpecificIde: true };
				}
			}
			const cookieNames = [];
			if (repoId) {
				cookieNames.push(`${defaultCookieName}--${repoId}`);
			}
			cookieNames.push(defaultCookieName);

			for (const cookieName of cookieNames) {
				const cookie = this.request.cookies && this.request.cookies[cookieName];
				if (cookie) {
					const mappedIde = ides.find(_ => _.moniker === cookie);
					if (mappedIde) {
						return { lastOrigin: mappedIde, autoOpen: autoOpen, isMru: true };
					}
				}
			}
			if (users && users.length) {
				for (let i = 0; i < users.length; i++) {
					// kind of a hack but only allow the first user (the user that is viewing) to autoOpen
					autoOpen = autoOpen && i === 0;
					const user = users[i];
					if (user) {
						const userLastOrigin = user.lastOrigin;
						const userLastOriginDetail = user.lastOriginDetail;

						if (userLastOrigin && userLastOrigin.toLowerCase() === 'jetbrains') {
							if (userLastOriginDetail) {
								const userLastOriginDetailToLower = userLastOriginDetail.toLowerCase();
								// get all the jetbrains ides
								const jetBrainsIdes = ides.filter(_ => _.moniker && _.moniker.indexOf('jb-') === 0);
								for (const ide of jetBrainsIdes) {
									if (userLastOriginDetailToLower.indexOf(ide.ideName.split(' ')[0].toLowerCase()) > -1) {
										return { lastOrigin: ides.find(_ => _.moniker === ide.moniker), isLastOriginDetail: true, autoOpen: autoOpen };
									}
								}
							}
							// don't have a detail or couldn't match, assume intellij (most used JB ide), autoOpen is false because we're not sure
							return { lastOrigin: ides.find(_ => _.moniker === 'jb-idea'), isLastOriginDetail: true, autoOpen: false };
						}
						else if (userLastOrigin && userLastOrigin.toLowerCase() === 'vs code') {
							if (userLastOriginDetail && userLastOriginDetail.toLowerCase().indexOf('insiders') > -1) {
								return { lastOrigin: ides.find(_ => _.moniker === 'vsc-insiders'), isLastOriginDetail: true, autoOpen: autoOpen };
							}
							return { lastOrigin: ides.find(_ => _.moniker === 'vsc'), isLastOriginDetail: true, autoOpen: autoOpen };
						}
						else if (userLastOrigin) {
							// atom & VS fall here, they don't have a specific ide to open
							const mapped = lastOriginToIdeMonikers[userLastOrigin];
							if (mapped) {
								return { lastOrigin: ides.find(_ => _.moniker === mapped), isLastOriginDetail: true, autoOpen: autoOpen };
							}
						}
					}
				}
			}
		}
		catch (x) {
			this.log(`Failed to select ide: ${x}`);
		}

		return { lastOrigin: ides.find(_ => _.moniker === 'vsc'), isDefaultIde: true, autoOpen: false };
	}
}

module.exports = WebRequestBase;