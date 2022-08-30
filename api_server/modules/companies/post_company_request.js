// handle the 'POST /companies' request, to create a new company

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const TeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_creator');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');

class PostCompanyRequest extends PostRequest {

	async authorize () {
		// anyone can create a company at any time
	}

	// process the request
	async process () {
		await this.requireAndAllow();
		this.teamCreatorClass = TeamCreator; // this avoids a circular require
		return super.process();
	}

	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				optional: {
					string: ['demo']
				}
			}
		);
	}

	// handle response to the incoming request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// only return a full response if we are not in one-user-per-org (ONE_USER_PER_ORG),
		// or this was the user's first company
		if (this.transforms.additionalCompanyResponse) {
			this.log('NOTE: sending additional company response to POST /companies request');
			this.responseData = this.transforms.additionalCompanyResponse;
		} else {
			if (this.transforms.createdTeam) {
				this.responseData.team = this.transforms.createdTeam.getSanitizedObject({ request: this });
				this.responseData.team.companyMemberCount = 1;
			}
			if (this.transforms.createdTeamStream) {
				this.responseData.streams = [
					this.transforms.createdTeamStream.getSanitizedObject({ request: this })
				]
			}
		}
		this.log("*** post_company response " + JSON.stringify(this.responseData));
		return super.handleResponse();
	}

	// after we've processed the request....
	async postProcess () {
		// only necessary when not in ONE_USER_PER_ORG, once we have moved fully to that,
		// this can be completely removed
		if (!this.transforms.additionalCompanyResponse) {
			await this.publishUserUpdate();
		}
		if (this.request.query.demo) {
			const repoId = await this.createCodemark();
			console.info("*** demo repoId " + repoId);
			await this.postProcessPersist();
			await this.createReview(repoId);
		}
	}

	async createReview(repoId) {
		this.log("*** demo createReview repoId: " + repoId);
		const streamId = this.transforms.createdTeamStream.id;
		const postCreator = new PostCreator({
			request: this,
			mentionedUserIds: [],
			usersBeingAddedToTeam: [],
		});

		const createReviewResponse = await postCreator.createPost({
			teamId: this.transforms.createdTeam.id,
			streamId,
			"text": "Simple FR",
			"mentionedUserIds": [],
			"files": [],
			"origin": "VS Code",
			"originDetail": "Visual Studio Code",
			review: {
				teamId: this.transforms.createdTeam.id,
				streamId,
				"title": "Simple FR",
				"text": "Made some changes",
				"reviewers": [],
				"addedUsers": [],
				"allReviewersMustApprove": false,
				"authorsById": {},
				"tags": [],
				"status": "open",
				"files": [],
				"entryPoint": "Feedback Requests Section",
				"mentionedUserIds": [],
				"markers": [],
				"reviewChangesets": [
					{
						"repoId": repoId,
						"branch": "feature/dev",
						"commits": [
							{
								"sha": "83a541aabd8f0cfaa08f4149b05a89da534f88fa",
								"info": {
									"repoPath": "/workspaces/python_clm_demo",
									"ref": "83a541aabd8f0cfaa08f4149b05a89da534f88fa",
									"author": "dsellarsnr",
									"email": "101134401+dsellarsnr@users.noreply.github.com",
									"authorDate": "2022-06-25T00:43:22.000Z",
									"committerDate": "2022-06-25T02:21:39.000Z",
									"message": "Add devcontainer config",
									"shortMessage": "Add devcontainer config"
								},
								"localOnly": false
							}
						],
						"modifiedFiles": [
							{
								"linesAdded": 21,
								"linesRemoved": 0,
								"oldFile": ".devcontainer/Dockerfile",
								"file": ".devcontainer/Dockerfile",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							},
							{
								"linesAdded": 57,
								"linesRemoved": 0,
								"oldFile": ".devcontainer/devcontainer.json",
								"file": ".devcontainer/devcontainer.json",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							},
							{
								"linesAdded": 2,
								"linesRemoved": 0,
								"oldFile": ".gitignore",
								"file": ".gitignore",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							}
						],
						"modifiedFilesInCheckpoint": [
							{
								"linesAdded": 21,
								"linesRemoved": 0,
								"oldFile": ".devcontainer/Dockerfile",
								"file": ".devcontainer/Dockerfile",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							},
							{
								"linesAdded": 57,
								"linesRemoved": 0,
								"oldFile": ".devcontainer/devcontainer.json",
								"file": ".devcontainer/devcontainer.json",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							},
							{
								"linesAdded": 2,
								"linesRemoved": 0,
								"oldFile": ".gitignore",
								"file": ".gitignore",
								"status": "M",
								"statusX": "M",
								"statusY": "M"
							}
						],
						"includeSaved": false,
						"includeStaged": false,
						"checkpoint": 0,
						"diffs": {
							"leftBaseAuthor": "Uma Annamalai",
							"leftBaseSha": "424b262e0215979fde76547c4b4154f024f2336d",
							"leftDiffsCompressed": "NoXSA===",
							"rightBaseAuthor": "Uma Annamalai",
							"rightBaseSha": "424b262e0215979fde76547c4b4154f024f2336d",
							"rightDiffsCompressed": "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",
							"rightReverseDiffsCompressed": "NobwRA9gNgJgYgSygUwHIEMC2ywC4wB0MyAbgMYQB2ALugpcgE4D0AIhGQNZMBmSOAGkiwAEsnTFGeMGCEMA7ohQZs05sRLNKAVyhRZYBWIlNpBgBbbKnAM55QwmAGVajangCMQ6DAAy9ZDtcACYvQ2R5F3Q3TzkI/wYggAYhKACg4DAAWgBiAAInZGQ88yZinghGPIRMdABzYooaZBobXBLqagAHNuZmOoRqSwAjAgpMZkwEMkYIGwgeamYSGwpiLI0sptoAxhtmakYi5aSCYIBmADYCJOZtugY95i6ATyGqLPPmIlJ73eZhugbMgCOwuLx+AYslD8sAAMLmCDTZAAXTyAAU3ojKHkSEwbAgqHkABTaYF5LLDXRQYEvYokaIIdCtPJEqAcdBQPLRTCXAAszAAgl0uigCkhplQAJTtc4CPLnAgeFIKggATnlioAHJqCAB2XWXTWU6m05C65UmvRm3Vqq005B03Va+021V612O82qy6ep0Kk02ahMC1JQPBxi28Mh1UuqlBmOKj3xiOG6NSIRZQUAJQA4nkAGo5gCSgtQABUALwAHTAistVOtXtrULg2YA8gBZPKYGYEKYzOYLahjCATFZrZDqX5UHaPfavd6UXBhgAkICL2dLFYAvlCYXl4YjkWjUBBiAQAFY2XH4wnLvKUKjeqDUfYAKnlHiNeQ8fK/wRfkkUI5vmqDtqwACiAD6BaQdmTjFu2qA1oYz4tpm2YAKqoNUPCHnktbruBUGwfBiHITutZ5AAhJWhFoQw1EogA3HkQwtHkNjaLiqznsUWwMdotQ2JweRJBJwR5AAZNJeQEHkzBkiw7JkJyzA2OY0RTpQJATLpmAEJpMlyQZ1SUEGnJcsREEwXBCFIagO55MEAB80keLWbF8Pumawu2XTUPenJosW+EvBA2hVF0CBdHkRwAI7aAgRzYCyjDaVALx5GQWmUA08pWOMaXUOx5gIDewJkEFRLUBA3IwDAZXIJg7H1Rx1S1A0BAHnC7bogAmvFyBJSlLUtG+BDUAAHqVByYF0zyxVk1ALcwB7YbhMVdOcFIbBV6DDCgWTbVkeJ7PeWylFwe1Pls6C5cg+1VPQll6BSVTzYtp2rYtiXJalE02FNs2EbWfl5JDJnxa1WSMPhX1LV0K0Lb52T+YFwVQGiWGUMVE1lRVXHINV95teZb1chIMCDFjeTtk4eRdA9nD1IEPUQ5t3KBVkDSldoXQwOgwbQ8g01dJUpVQQAQtu0Ftsh5aQagrCVk+lD0BGD1BXiYMHlD0PoDzfMUtlr20O9WRZHd5tWXDJNjmlMA3gAPBFUUnSzbNZGkQZZKURyuWjuSHgFNWUCFeS4/jNCEzeaQMOTtvvXU7KAlyT7EEzXsNMDG04VxPETvxFJkAx8xRWQxRKTYKkclAGlaUcWh6S3hnGbJj5dK1ydcrzeRu5FjCe1w3sB8grnUW5HkGNW1Z5Gej4RAnxTC3kLRNQseR8CgYAoqkATEGkUwRhkYDVpQs+X0IF9X3fN/X+fj+3w/99P2/L/v6/39f7/n//8/S+KIdzAIEOAHwSg0BYBwPgH45BZwPCYNOeBNBEGMCvPMR+PhjCSDMHERQ/AVAwLAMgrQ1IDBGHELg/AFgrC2HsOA2AUQYi4DCD4BIgQ8AAFYDThEiK4dwrD8EcOSAfRI9hsh9DyHASo29Ki1FKsQHYNJ5TAmKOYToPRcB9HQKzfs+wNB/EeBgqgCkZFVCaHwOorJMZUBsKooozU8jZkgoKVgnZILcmoPgTMUiNHdF6P0QYIxRwTAHLMeYixlh8XWJsIx+IDhHCnCQU4Fxri3HiU8Rc2JPhQnAJmas1BawR2wLWdotZMRLgVODKEhTaxUiQDAMpeR8nZDqUUsAMAODcHhvwZptYwQ9J3sgGpBSikdO2GLDp5TCAEFGW08ZtZoh1BsM0kAeRamLKWMwKOgthbFAAOSbm3OWA55MYo3XQBiLERJzoEioLKUMtpnS6gND6TZ7SpHCi6BvCkjYHR0lZFUdM5z6Dk2ZPTRmdz7wcwWZ8nZWFyR+npIyZkb5WQ4lUpyDF3JGC8gFN8sUTgJRNFhVkdpdSwDHLLOWfpdYlRhn+WaeZ5KtlSLDveOwYyKVgBInZcijk6XqxGTIbl1A9xjJ3EITMmypFwioFYqKxQ6rQCyDYH5ZAEB8DLl0WYPy3AIHZh8sAZAyR1SmAAL2FpytZHztl5HlZQRVRwmZ6qYEFQIXENVaumOTAsjN5UXjtbWYuxBbVisKVIwopV3zEB4OgXQ1B3w5QQbsL1JMfVl2BJ0egKyTE4gZFAbQnqiSZJykcfZZKKUdOzUFfKqy8AtI2RGxZYBsmmLjQm18xZmiMF1cgCM6JhbmDpTXOuakG7DHoM8G5lAWXVspe2ygBAE51rqAQFoh0UBNMbYcYt0q4VbNrEuldmtc0EFeKuyCEcjrIB3e0Pd5pg2tpPRUPFws10EATXVH5XQtRDqGKO5SzAsUN1eFkbQQUaQAmnd+iAv6tTzqPR0198iP3nqOizADI7G21jHSB+uM6INQf2FOygAIoAsyQwutts6CBvoUZ+l4RseDYaA7XAjE6iOQaQKR6dzGug8Go0e2jS5T00Aw8yGm1A2O4ZIcB0D3GSMwfI4CSg0nhM8pPau89PBKPcH/cO9j471LgZ49BsjzA9O6OQIhgwLbF10Z0/lfsLxXiyZmfhxTZnlOWcwG5l4mmX1ObPS514k4gwvBQB5hiXnCM+d4ypmdEXqBRZFQe1lNHtOhfXa8LpZBIvRaM3JuLXGEsWenXljghX0vPsc2J5zuWouaxi3hhT8WXjEcS5Zy9msguUpSxW9uTBzpYUYFAOl/itF9EsgMfKWQjYIFHMQIMQ2CBkgwoewpUrn3Pq+Y1JxxZWA3i3lMlo9yLJ5HdnkeQaKKYW23Td0oOIOplqJjMcQwYYBVpE2diyNrG2ZAcx0zANgTp0dDU9S9zIq79YmfxVb4hDKDaR3D2soOFsWqVSqmkBBIcbG6UwTbmXxkojtRKhZO2ZVjKkYiw5b7buMBgOiSWNgzl1R7DZ7keRfalS3hLNwN5XoICzq91NjxuQMiQFu4ooGso/akbWBn0Rmes+acAfewdI0IvJAciWQY4QVuDPKzAtR1Ps/qowKwKbTdSZvOgRYTAnFvZvB9/Z33ZU7OPXMaghvPvIBN2b+9DFtq7V7ntMkTu4bDVGoDVoIMOkZc9w6x2BNIqlQ500Bg1VuQ3lmBAUq5sqEKU7JUYo9AKjtCm4E3R6B9HRMnPbTABepyZP2OrOGEAC8/drKlFvdPGB0sh9RttPu/f7MD1Jul217tWQ+vJZg/0xolWBjNDpUI9ya5XkfGogx8QSIAR/QBR+T8/0P2f4/F/T9/0vzf6/5+79X6f4/l/D+3+3/f/fj/3+v97xAVKxheAQhaBaQAgAYIKOoJ8I4AwbBKhUwGhfBSBIhUA8AhASAsvChCIHBeA0VMASwawDIQA5hQRP8OURwERbhfBYgzwPkMghQCg3AMgleM+ZtMAPIfIOEWdPIYgKkaxGwF4TAYYaALlNgsgWdaCHg7QOodaanbIPHGJKcWeeeReBQFeLxdedTVkfCYZPeMRO9ZAY+PfPYA/H/Z/W+YBCwoAA==",
							"latestCommitSha": "83a541aabd8f0cfaa08f4149b05a89da534f88fa",
							"rightToLatestCommitDiffsCompressed": "NobwRA9gNgJgYgSygUwHIEMC2ywC4wB0MyAbgMYQB2ALugpcgE4D0AIhGQNZMBmSOAGkiwAEsnTFGeMGCEMA7ohQZs0oqQo06DFuy69+ssArESm0owAsArpU4BnPKGEwAyrUbU8ADiHQYADL0yI64AGxyyPLu6J4+kfJBDKG+YFDBocBgAAQAggBKAOLZqADyrACiAPoAahX5rgCSpagAvAA6xlTInUbZ+QCqqNkIPNnA2Z0AJCBllbX1TS0Avp3ZAIStk10MawC6ANzZ1JbIlNn21tkk9hTE2QC0ZNvWmOj2nNkADD8ATNkAMgB2QI2WY1nsLCgHHQUGY9kssWQzEoJEwKLRBARgOBqMwI0o9loUCg2Rmc2qdQazVQy2yvwAfACAIydI58PpGADUAGFSgAFACaIOI5CotGCLDuIWojHEmAINwQAA8wZYINhmDdpcxpUS5VhFfYVdy+gBicalAAO1AQVFhe2yjTGAE8INZGNkrQgrdk5QBHawIOXYGj2P1IqAu7JkRGUADmyAE2VsFEwoeox0sCHD9mQZFtVGOEGyEhgWeQ+OoJZOyBGb0TBHN2T5Qr9yEDwcrZ2o9gI1GVmeY1EwVuY3qtDxHY+bg2GE4AzI8HjAc+gAEYoB4Th4kJjGqhPU5cZeUCBPdCx5Ar4MEomw0kPT3D0fjn1T18BoMhnt9geZ9pOj2IR0gYYh0kwBBqH3JwwHaSgjHgxCEKEJDUJQuCMLQzCwD2ZY8IEcB/CUNAsBwfB1DFLRJWYUVNAlHQCAAK3sKgjH8UxJAsBISJUcjCDo8VtCYWiNCEyVmNYjCTHELj8CsWwHCcIjYBiOJcAXBc/FgJIQjwZkABYEjUrwNK04wol00JmQiNIMlgyZqHaJyXM6K0XROKgCFA20EwIdy9WoF0UH5dATk6XBtnBSFmGhMhYXHF0HmsW0oHsZh13oRLAuCnojCERznKKpywHczzKG8+hfPjfyXRgDgiVy0LwrwKKIShGE4Xc5LUvSzLKES+qyEalBOiEArism0qPPVCqfPoGr3J85rLAitqYrihLupSpA+qypaqrGowHkm1ywECg0FTzRg90YAZGCgNbOksahqCtexcGYeFaHjBaHnQb0CAu+UCAhXohC5U6ivOiBiH1EHrtu+7Hta57Xvez7mHkCBGE4IgkGhQlkBJWI+zTXBmV+L4AHYAE4johqGSuBw1V3sDcUHcRgEALVxXACNbZWsJNuSZzoWYVK1GAgZUXVcawrStHGSsizoIB4HhwZyU7lnG7XXK8CaDa+vIYHLWsnVYcN1eyZBBzOA9CWyN0rnkdAaDvYkUHLeRTnOC36OEz0cxjA1oJgJsjamu3oMJO1CTWrIo4NzpMHsbcZq87VYevJb3bIPK9ZOlPmZz+HDQlhmwGLqGwDT/6AC8PWQatoD7bPiBXDhuEYLWuS+sWYbh2UQcr/KwEhkvOmYdVNQ75EJaNFUtcKly9j6Yrlg36hddwkDgnAhBIOgxhMhw9DkMvi/r/P2/sPvrDH6vu+n5vpCCJUtwPFMgBWcz/CsngH+xlv5AOARZRI9lwj72SA5beJseQagzNkd0mZqwxioAwAspZwzSwgJmegRJZKggALI4zrPQHgEBIovTeh9L66BODoAIGnLUtwc5PkrPghe4kdDpTPJQJ8EB8GR31p0EM3CBjXSemAeeVca6lQgESHkYdkCIPTO7GAMiJyewfI8T0BBmBfi7BmP8g4+7QyVso1R6i3iUC0ajUqPpdEkn0SCIxHZvzdjDP2cx49J5uSUdQEytjNGJ3FjnMa2RthPiidPbGuN7BWkvCERK5UqhkCgJgKoxBMAQHhIwMgzA3j0FqkBPoW9gJ2TAsTI+UEYK4CyA/Z+zS34ITwh0oAA==",
							"latestCommitToRightDiffsCompressed": "NoXSA==="
						}
					}
				]
			}
		});

		this.log("*** demo createReviewResponse: " + JSON.stringify(createReviewResponse));
	}

	async createCodemark() {
		this.log("*** demo createCodemark");
		const streamId = this.transforms.createdTeamStream.id;
		// const createdUserId = this.transforms.createdUser.id;
		// const updatedRequest = Object.assign({}, this); // Not working - isForTesting is not a function
		// updatedRequest.user = this.transforms.createdUser;
		// this.user = this.transforms.createdUser;
		// this.user = this.transforms.userUpdate;
		const postCreator = new PostCreator({
			request: this,
			mentionedUserIds: [],
			usersBeingAddedToTeam: [],
		});
		const createPostResponse = await postCreator.createPost({
			teamId: this.transforms.createdTeam.id,
			"text": "Codemark example",
			streamId,
			"dontSendEmail": false,
			"mentionedUserIds": [],
			"addedUsers": [],
			"files": [],
			codemark: {
				"codeBlocks": [
					{
						"uri": "file:///Users/dsellars/workspace/python_clm_demo/src/main.py",
						"range": {
							"cursor": {
								"line": 8,
								"character": 0
							},
							"start": {
								"line": 8,
								"character": 0
							},
							"end": {
								"line": 8,
								"character": 11
							}
						},
						"contents": "def main():",
						"scm": {
							"file": "src/main.py",
							"repoPath": "/Users/dsellars/workspace/python_clm_demo",
							// "repoId": "6365185712771a37c2c0f644",
							"revision": "a507b0d6ead16b1fe0b8ad87fb5125af48df8692",
							"fixedGitSha": false,
							"authors": [
								{
									"email": "demodemo@newrelic.com"
								}
							],
							"remotes": [
								{
									"name": "origin",
									"url": "github.com/teamcodestream/python_clm_demo"
								}
							],
							"branch": "feature/dev"
						}
					}
				],
				"deleteMarkerLocations": {},
				"text": "Codemark example",
				"type": "comment",
				"assignees": [],
				"title": "",
				"tags": [],
				"relatedCodemarkIds": [],
				"isChangeRequest": false,
				"addedUsers": [],
				"files": [],
				"textDocuments": [
					{
						"uri": "file:///Users/dsellars/workspace/python_clm_demo/src/main.py"
					}
				],
				"entryPoint": "Gutter",
				"remotes": [
					"github.com/teamcodestream/python_clm_demo"
				],
				"mentionedUserIds": [],
				"markers": [
					{
						"code": "def main():",
						"commitHash": "a507b0d6ead16b1fe0b8ad87fb5125af48df8692",
						"referenceLocations": [
							{
								"commitHash": "a507b0d6ead16b1fe0b8ad87fb5125af48df8692",
								"location": [
									9,
									1,
									9,
									12,
									{}
								],
								"flags": {
									"canonical": true
								}
							},
							{
								"commitHash": "b5f455190bc49f10230678bc40c5e45266b3f3cd",
								"location": [
									1,
									1,
									1,
									1,
									{
										"contentChanged": true,
										"startWasDeleted": true,
										"endWasDeleted": true,
										"entirelyDeleted": true
									}
								],
								"flags": {
									"backtracked": true
								}
							},
							{
								"commitHash": "ae33c31b57983943cd795d931bc0e1ca15e4a4d2",
								"location": [
									9,
									1,
									9,
									12,
									{}
								],
								"flags": {
									"backtracked": true
								}
							}
						],
						"branchWhenCreated": "feature/dev",
						"remotes": [
							"github.com/teamcodestream/python_clm_demo"
						],
						"remoteCodeUrl": {
							"displayName": "GitHub",
							"name": "github",
							"url": "https://github.com/teamcodestream/python_clm_demo/blob/a507b0d6ead16b1fe0b8ad87fb5125af48df8692/src/main.py#L9"
						},
						"file": "src/main.py",
						// "repoId": "6365185712771a37c2c0f644"
					}
				],
				"remoteCodeUrl": {
					"displayName": "GitHub",
					"name": "github",
					"url": "https://github.com/teamcodestream/python_clm_demo/blob/a507b0d6ead16b1fe0b8ad87fb5125af48df8692/src/main.py#L9"
				}
			}
		});

		this.log("*** createCodemarkResponse: " + JSON.stringify(createPostResponse));
		this.log("*** createdRepos: " + JSON.stringify(this.transforms.createdRepos));
		return this.transforms.createdRepos[0].id;
		// await postCreator.postCreate({postPublishData: createPostResponse });
	}


	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishUserUpdate () {
		const message = {
			requestId: this.request.id,
			company: this.responseData.company,
			team: this.responseData.team,
			user: this.transforms.userUpdate
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish company creation message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a new company';
		description.access = 'No access rules; anyone can create a new company at any time.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name*': '<Name of the company>'
			}
		};
		description.returns.summary = 'The created company object';
		return description;
	}
}

// wait this number of milliseconds
const Wait = function(time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

module.exports = PostCompanyRequest;
