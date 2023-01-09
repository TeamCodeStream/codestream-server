const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const DemoTemplateIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/demo_templates/indexes');

class DemoHelper {

    constructor (options) {
        Object.assign(this, options);
    }

    async getTemplate () {
        const templateResult = await this.data.demoTemplates.getByQuery(
            {name: 'Demo1'},
            {hint: DemoTemplateIndexes.byName}
        );
        if (templateResult.length === 0) {
            console.error('Template not found: ' + 'Demo1');
            return;
        }

        const template = templateResult[0];
        return template.attributes.documents;
    }

    async createCodemark () {
        this.request.log('*** demo createCodemark');
        const streamId = this.transforms.createdTeamStream.id;
        // const createdUserId = this.transforms.createdUser.id;
        // const updatedRequest = Object.assign({}, this); // Not working - isForTesting is not a function
        // updatedRequest.user = this.transforms.createdUser;
        // this.user = this.transforms.createdUser;
        // this.user = this.transforms.userUpdate;

        const documents = await this.getTemplate();

        // this.request.log(`template: ${JSON.stringify(documents, null, 2)}`);

        const postCreator = new PostCreator({
            request: this.request,
            mentionedUserIds: [],
            usersBeingAddedToTeam: [],
        });

        // TODO iterate over loop
        const codemark = documents.codemarks[0];

        // TODO handle multiple markers in single codemark
        const markerId = codemark.markerIds[0];

        const marker = documents.markers.find(_ => _._id === markerId);

        const post = documents.posts.find(_ => _._id = codemark.postId);

        const createCodemark = {
            teamId: this.transforms.createdTeam.id,
            text: codemark.text,
            streamId,
            dontSendEmail: true,
            // mentionedUserIds: [],
            // addedUsers: [],
            // files: [],
            codemark: {
                // "codeBlocks": [
                //     {
                //         "uri": "file:///Users/dsellars/workspace/python_clm_demo/src/main.py",
                //         "range": {
                //             "cursor": {
                //                 "line": 8,
                //                 "character": 0
                //             },
                //             "start": {
                //                 "line": 8,
                //                 "character": 0
                //             },
                //             "end": {
                //                 "line": 8,
                //                 "character": 11
                //             }
                //         },
                //         "contents": "def main():",
                //         "scm": {
                //             "file": "src/main.py",
                //             "repoPath": "/Users/dsellars/workspace/python_clm_demo",
                //             // "repoId": "6365185712771a37c2c0f644",
                //             "revision": "a507b0d6ead16b1fe0b8ad87fb5125af48df8692",
                //             "fixedGitSha": false,
                //             "authors": [
                //                 {
                //                     "email": "demodemo@newrelic.com"
                //                 }
                //             ],
                //             "remotes": [
                //                 {
                //                     "name": "origin",
                //                     "url": "github.com/teamcodestream/python_clm_demo"
                //                 }
                //             ],
                //             "branch": "feature/dev"
                //         }
                //     }
                // ],
                deleteMarkerLocations: {},
                text: codemark.text,
                type: codemark.type,
                assignees: [],
                title: codemark.title,
                tags: codemark.tags,
                relatedCodemarkIds: codemark.relatedCodemarkIds,
                isChangeRequest: false,
                addedUsers: [],
                files: post.files,
                // "textDocuments": [
                //     {
                //         "uri": "file:///Users/dsellars/workspace/python_clm_demo/src/main.py"
                //     }
                // ],
                // "entryPoint": "Gutter",
                remotes: marker.remotesWhenCreated,
                mentionedUserIds: [],
                markers: [
                    {
                        code: marker.code,
                        commitHash: marker.commitHashWhenCreated,
                        referenceLocations: marker.referenceLocations,
                        branchWhenCreated: marker.branchWhenCreated,
                        remotes: marker.remotesWhenCreated,
                        remoteCodeUrl: marker.remoteCodeUrl,
                        file: marker.file,
                        // "repoId": "6365185712771a37c2c0f644"
                    }
                ],
                remoteCodeUrl: marker.remoteCodeUrl
            }
        };

        this.request.log(`*** createReview: ${JSON.stringify(createCodemark)}`);

        const createPostResponse = await postCreator.createPost(createCodemark);

        this.request.log('*** createCodemarkResponse: ' + JSON.stringify(createPostResponse));
        this.request.log('*** createdRepos: ' + JSON.stringify(this.transforms.createdRepos));
        return this.transforms.createdRepos[0].id;
        // await postCreator.postCreate({postPublishData: createPostResponse });
    }

    async createReview (repoId) {
        this.request.log('*** demo createReview repoId: ' + repoId);

        const documents = await this.getTemplate();

        const review = documents.reviews[0];

        const streamId = this.transforms.createdTeamStream.id;

        const postCreator = new PostCreator({
            request: this.request,
            mentionedUserIds: [],
            usersBeingAddedToTeam: [],
        });

        // const oldRepoKey = Object.getOwnPropertyNames(review.reviewDiffs)[0];
        // const diffs = review.reviewDiffs[oldRepoKey];
        // review.reviewDiffs[repoId] = diffs;
        // delete review.reviewDiffs[oldRepoKey];

        // Hackery - api is different from mongo schema - maybe we should snapshot api calls
        // instead of mongo collections?
        const diffs = review.checkpointReviewDiffs[0].diffs;

        const createReview = {
            teamId: this.transforms.createdTeam.id,
            streamId,
            text: review.text,
            // mentionedUserIds: [],
            files: [],
            // origin: review.origin,
            // originDetail: review.originDetail,
            // reviewers: ??,
            review: {
                teamId: this.transforms.createdTeam.id,
                streamId,
                title: review.title,
                text: review.text,
                reviewers: [],
                addedUsers: [],
                allReviewersMustApprove: false,
                authorsById: review.authorsById,
                tags: review.tags,
                status: review.status,
                files: [],
                entryPoint: review.entryPoint,
                mentionedUserIds: [],
                // markers: [],
                reviewChangesets: review.reviewChangesets.map(r => ({...r, repoId: repoId, diffs})),
            },
            // reviewDiffs: review.reviewDiffs,
            // checkpointReviewDiffs: { ...review.checkpointReviewDiffs, repoId: repoId },

        };

        this.request.log(`*** createReview: ${JSON.stringify(createReview)}`);

        const createReviewResponse = await postCreator.createPost(createReview);

        this.request.log('*** demo createReviewResponse: ' + JSON.stringify(createReviewResponse));
    }
}

module.exports = DemoHelper;