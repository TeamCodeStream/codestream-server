import * as rm from 'typed-rest-client/RestClient';
import { LoginResult, PostResult, Codemark, Review, Post, ReplyBase, CodemarkReply, Reply } from './models';
import { RestClient } from './restClient';
import { log } from './logger';
import { State } from './state';

export const defaultSleep = 50;
export const sleep = (waitTimeInMs) => new Promise(resolve => {
    log.verbose(`Sleeping for ${waitTimeInMs}ms`);
    setTimeout(resolve, waitTimeInMs);
});

export class Flow {
    private restClient: RestClient;
    constructor(baseUrl: string, userAgentName: string = 'emailqabot') {
        if (!baseUrl) throw new Error('baseUrl');

        this.restClient = new RestClient(new rm.RestClient(userAgentName, baseUrl));
        return this;
    }

    async login(emailAddress: string, password: string, options: { teamId: string, otherEmail: string }) {
        let restRes: rm.IRestResponse<LoginResult> = await this.restClient.put<LoginResult>('/no-auth/login', {
            email: emailAddress,
            password: password
        });
        return await (new LoggedInFlow(this.restClient, restRes.result)).initialize(options);
    }
}

export class PostFlow {
    private accessToken: string;
    private post?: Post;
    private codemark?: Codemark;
    private review?: Review;

    constructor(private restClient: RestClient, private state: State, private postResult: PostResult) {
        this.accessToken = state.loginResult.accessToken;
        this.post = postResult.post,
            this.codemark = postResult.codemark;
        this.review = postResult.review;
    }

    async reply(reply: ReplyBase) {
        const mentionedUserIds = this.state.getMentionedUsers([reply.text]);
        reply.text = this.state.buildText(reply.text);

        if (reply instanceof Reply) {
            //let codemarkWithMarkersPost = codemarkWithMarker.result.post;
            let replyResult: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
                streamId: this.state.streamId,
                text: reply.text,
                codemarkId: this.codemark ? this.codemark.id : undefined,
                reviewId: this.review ? this.review.id : undefined,
                parentPostId: this.post ? this.post.id : undefined,
                mentionedUserIds: mentionedUserIds,
            }, { additionalHeaders: { 'Authorization': `Bearer ${this.accessToken}` } });
           
            return new PostFlow(this.restClient, this.state, replyResult.result);
        }
        else if (reply instanceof CodemarkReply) {
            if (!this.review) throw new Error('Codemark replies only work reviews');

            let markers = [];
            let extensions = {
                0: '.html',
                1: '.tsx',
                2: '',
                3: '.js'
            }
            for (let i = 0; i < reply.markerCount; i++) {
                markers.push({
                    code: `<script>
// this is a js comment ${i}
</script>

<div className="footer">
broken html...
<p style="color:red;">
This should not be red <a href="#">This should not be clickable</a>
</p>

<!-- another comment ${i} -->
<marquee>this should have syntax highlighting if file extension is html or js</marquee>`,
                    streamId: this.state.streamId,
                    file: `cheeses/swiss${i}${extensions[i]}`,
                    repoId: this.state.repoId,
                    branchWhenCreated: 'feature/cheeses',
                    commitHashWhenCreated: 'b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fq',
                    remoteCodeUrl: {
                        name: 'github',
                        url: 'https://github.com/microsoft/botbuilder-samples/blob/b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fd/samples/javascript_nodejs/03.welcome-users/package.json#L9'
                    }
                })
            }
            let replyResult: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
                streamId: this.state.streamId,
                text: reply.text,
                parentPostId: this.post ? this.post.id : undefined,
                reviewId: this.review ? this.review.id : undefined,
                mentionedUserIds: mentionedUserIds,
                codemark: {
                    type: 'comment',
                    text: reply.text,
                    reviewId: this.review.id,
                    streamId: this.state.streamId,
                    markers: markers
                },
            }, { additionalHeaders: { 'Authorization': `Bearer ${this.accessToken}` } });
            return new PostFlow(this.restClient, this.state, replyResult.result);
        }
    }
}

export class LoggedInFlow {
    private accessToken: string;
    private state: State;

    constructor(private restClient: RestClient, private loginResult: LoginResult) {
        this.accessToken = loginResult.accessToken;
    }

    async initialize(options: { teamId: string, otherEmail: string }) {
        this.state = new State();
        this.state.loginResult = this.loginResult;
        const loggedInUser = this.loginResult.user
        if (!loggedInUser.preferences || !loggedInUser.preferences.notifications || loggedInUser.preferences.notifications != 'all') {
            throw new Error(`Ensure ${loggedInUser.email} has 'Automatically follow all new codemarks and reviews' enabled`);
        }

        const streams = await this.restClient.get<{ streams: any[] }>(`/streams?teamId=${options.teamId}&type=channel`, {
            additionalHeaders: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        let found = false;
        for (const stream of streams.result.streams) {
            if (stream.isTeamStream && stream.name === 'general') {
                this.state.stream = stream;
                this.state.streamId = stream.id
                found = true;
                log.debug(`found stream id=${stream.id}, name=${stream.name}, isTeamStream=${stream.isTeamStream}`);
                break;
            }
        }
        if (!found) throw new Error('Could not find isTeamStream=true, name=\'general\'');

        const repos = await this.restClient.get<{ repos: any[] }>(`/repos?teamId=${options.teamId}`, {
            additionalHeaders: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        found = false;
        for (const repo of repos.result.repos) {
            if (!repo.deactivated && !repo._forTesting) {
                this.state.repo = repo;
                this.state.repoId = repo.id
                found = true;
                log.debug(`found repo id=${repo.id}, name=${repo.name}`);
                break;
            }
        }

        if (!found) throw new Error('Could not find a matching repo');

        if (options.otherEmail) {
            const users = await this.restClient.get<{ users: any[] }>(`/users?teamId=${options.teamId}`, {
                additionalHeaders: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            found = false;
            for (const user of users.result.users) {
                const otherEmail = options.otherEmail.toLowerCase();
                if (!user.deactivated && user.email.toLowerCase() === otherEmail) {
                    this.state.otherUser = user;
                    found = true;
                    log.debug(`found otherEmail, email=${otherEmail}, username=${user.email}`);
                    log.info(`Ensure ${otherEmail} has 'Automatically follow all new codemarks and reviews' enabled`);
                    break;
                }
            }

            if (!found) throw new Error('Could not find a matching other user');
        }
        else {
            log.debug('no otherEmail');
        }

        return this;
    }

    async createCodemarkWithoutMarkers(text: string = 'codemark without markers', type: string = 'comment') {
        const mentionedUserIds = this.state.getMentionedUsers([text]);
        text = this.state.buildText(text);
        let codemarkWithoutMarkers: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
            streamId: this.state.streamId,
            codemark: {
                type: type,
                text: text,
            },
            mentionedUserIds: mentionedUserIds
        }, {
            additionalHeaders: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        console.log(JSON.stringify(codemarkWithoutMarkers, null, 4));
        return new PostFlow(this.restClient, this.state, codemarkWithoutMarkers.result);
    }

    async createCodemarkWithMarker(text: string = 'codemark with marker', type: string = 'comment', code: string = '') {
        const mentionedUserIds = this.state.getMentionedUsers([text]);
        text = this.state.buildText(text);
        let codemarkWithMarker: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
            streamId: this.state.streamId,
            mentionedUserIds: mentionedUserIds,
            codemark: {
                type: type,
                text: text,
                streamId: this.state.streamId,
                markers: [{
                    code: code ? code : `<script>
                    // this is a js comment
                    </script>
                    
                    <div className="footer">
                    broken html...
                    <p style="color:red;">
                    This should not be red <a href="#">This should not be clickable</a>
                    </p>
                    
                    <!-- another comment -->
                    <marquee>this should have syntax highlighting</marquee>`,
                    streamId: this.state.streamId,
                    file: 'cheeses/swiss.html',
                    repoId: this.state.repoId,
                    branchWhenCreated: 'feature/cheeses',
                    commitHashWhenCreated: 'b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fq',
                    remoteCodeUrl: {
                        name: 'github',
                        url: 'https://github.com/microsoft/botbuilder-samples/blob/b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fd/samples/javascript_nodejs/03.welcome-users/package.json#L9'
                    }
                }]
            },
        }, { additionalHeaders: { 'Authorization': `Bearer ${this.accessToken}` } });
        return new PostFlow(this.restClient, this.state, codemarkWithMarker.result);
    }

    async createCodemarkWithMarkers(text: string = 'codemark with markers', type: string = 'comment', code: string = '//comment') {
        const mentionedUserIds = this.state.getMentionedUsers([text]);
        text = this.state.buildText(text);
        let codemarkWithMarkers: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
            streamId: this.state.streamId,
            mentionedUserIds: mentionedUserIds,
            codemark: {
                type: type,
                text: text,
                streamId: this.state.streamId,
                markers: [{
                    code: code + '1',
                    streamId: this.state.streamId,
                    file: 'cheeses/swissBar.js',
                    repoId: this.state.repoId,
                    branchWhenCreated: 'feature/cheeses',
                    commitHashWhenCreated: 'c57c390c7c5cf58b4a9cc6e7e5d874eecc23b5fq',
                    referenceLocations: [
                        { location: [10, 30, 40, 50] }
                    ],
                    remoteCodeUrl: {
                        name: 'github',
                        url: 'https://github.com/microsoft/botbuilder-samples/blob/b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fd/samples/javascript_nodejs/03.welcome-users/package.json#L9'
                    }
                },
                {
                    code: code + '2',
                    streamId: this.state.streamId,
                    file: 'cheeses/swissFoo.js',
                    repoId: this.state.repoId,
                    branchWhenCreated: 'feature/cheeses',
                    commitHashWhenCreated: 'b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fq',
                    referenceLocations: [
                        { location: [1, 3, 4, 5] }
                    ],
                    remoteCodeUrl: {
                        name: 'github',
                        url: 'https://github.com/microsoft/botbuilder-samples/blob/b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fd/samples/javascript_nodejs/03.welcome-users/package.json#L9'
                    }
                },
                ]
            },
        }, { additionalHeaders: { 'Authorization': `Bearer ${this.accessToken}` } });
        return new PostFlow(this.restClient, this.state, codemarkWithMarkers.result);
    }

    async createReview(
        title: string = 'this is review title',
        text: string = 'this is review description',
        reviewers: string[] = ['{{atOtherUser}}'],
        tags: string[] = [],
    ) {
        const mentionedUserIds = this.state.getMentionedUsers([title, text]);
        title = this.state.buildText(title);
        text = this.state.buildText(text);
        if (reviewers && reviewers.length == 1 && reviewers[0] === '{{atOtherUser}}' && this.state.otherUser) {
            reviewers[0] = this.state.otherUser.id;
        }
        let reviewNoTags: rm.IRestResponse<PostResult> = await this.restClient.post<PostResult>('/posts', {
            streamId: this.state.streamId,
            mentionedUserIds: mentionedUserIds,
            review: {
                streamId: this.state.streamId,
                title: title,
                text: text,
                status: 'open',
                tags: tags,
                reviewers: reviewers,
                reviewChangesets: [{
                    repoId: this.state.repoId,
                    branch: 'feature/add-2fa',
                    commits: [{
                        info: {
                            author: 'brian canzanella'
                        },
                        sha: 'b47c390c7c5cf58b4a9cc6e7e5d874eecc23b5fq'
                    }],
                    modifiedFiles: [{
                        file: '.gitignore',
                        linesAdded: 2,
                        linesRemoved: 5,
                        status: 'M'
                    },
                    {
                        file: 'foo.bar',
                        linesAdded: 21,
                        linesRemoved: 56,
                        status: 'M'
                    }]
                }]
            },
        }, { additionalHeaders: { 'Authorization': `Bearer ${this.accessToken}` } });
        return new PostFlow(this.restClient, this.state, reviewNoTags.result);
    }
}


