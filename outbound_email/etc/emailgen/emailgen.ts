#!/usr/bin/env node
import { Reply, CodemarkReply } from './models';
import { Flow, sleep } from './flows';
import { Command } from 'commander';
import { log } from './logger';
import * as fs from 'fs';

// handle tutorial in creating a typescript console app
//https://galdin.dev/blog/writing-a-node-console-app-in-typescript/

(async () => {
    const main = async function () {
        let program;
        const argv = process.execArgv.join();
        const isDebug = argv.includes('inspect') || argv.includes('debug');

        if (!isDebug) {            
            // if we're not debugging, assume command line
            if (process.argv.indexOf('--config') > -1) {
                program = new Command();
                program
                    .version('0.1.0')
                    .option('-c, --config [path]', 'Path to a custom .emailgen.json config file')
                    .option('-v, --verbose', 'enables additional logging')
                    .parse(process.argv);
            }
            if (!program || !program.config) {
                program = new Command();
                program
                    .version('0.1.0')
                    .requiredOption('-e, --email [email]', 'CodeStream email')
                    .requiredOption('-p, --password [password]', 'CodeStream password')
                    .requiredOption('-s, --serverUrl [url]', 'CodeStream api_server url')
                    .requiredOption('-t, --teamId [id]', 'CodeStream teamId')
                    .option('-o, --otherEmail [email]', 'Email of another user on the team you\'d like to annoy with emails ;)')
                    .option('-ff, --fail-fast', 'if true, stops on the first failure')
                    .option('-v, --verbose', 'enables additional logging')
                    .parse(process.argv);
            }
            else {
                program = JSON.parse(fs.readFileSync('.emailgen.json', 'utf8'));
            }
        }
        else {
            program = JSON.parse(fs.readFileSync('.emailgen.json', 'utf8'));
        }

        log.isVerbose = program.verbose;
        log.info(`Using serverUrl=${program.serverUrl} with email=${program.email}`);

        const flow = (await new Flow(program.serverUrl)
            .login(program.email, program.password, { teamId: program.teamId, otherEmail: program.otherEmail }))

        // this is the collection of operations that will generate emails
        // they try to use named methods that are obvious in what they're doing, 
        // as well as title/text/descriptions that further describe what its doing
        const operations = [
            async () => await flow.createCodemarkWithoutMarkers(
                'codemark. without markers {{atUser}} {{atOtherUser}}'
            ),

            async () => flow.createCodemarkWithMarker(
                'codemark. single marker'
            ),

            async () => (await flow.createCodemarkWithMarker('codemark. with single marker 2'))
                .reply(new Reply('reply. codemark. with single marker 2 {{atUser}}')),

            async () => (await flow.createCodemarkWithMarkers('codemark. multi markers'))
                .reply(new Reply('reply. codemark. multi markers {{atUser}} {{atOtherUser}}')),

            async () => (await flow.createReview(
                'review. title 1 (no reviewers, no tags)',
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris semper neque at erat aliquam luctus. Donec a viverra sapien, a facilisis arcu. Aenean eu metus vel leo suscipit suscipit a a nibh. ',
                null
            )),

            async () => (await flow.createReview(
                'review. title 2 (no reviewers, 2 tags. will have /me message reply)',
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris semper neque at erat aliquam luctus. Donec a viverra sapien, a facilisis arcu. Aenean eu metus vel leo suscipit suscipit a a nibh. ',
                null,
                ['_green', '_red']
            )).reply(new Reply('/me approved this review')),
            
            async () => {
                const review = await flow.createReview(
                    'review. title 2.5 (reviewers, tags, multi-marker)',
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris semper neque at erat aliquam luctus. Donec a viverra sapien, a facilisis arcu. Aenean eu metus vel leo suscipit suscipit a a nibh.',
                    ['{{atOtherUser}}'],
                    ['_blue', '_red', '_green', '_yellow']
                )
                const reply2 = await review.reply(new CodemarkReply('codemark as reply. review. title 2.5. {{atOtherUser}} {{atUser}} (first reply, 1st codemark)', 3));
                await review.reply(new Reply("/me added {{atOtherUser}} {{atUser}} to this review"));
                reply2.reply(new Reply('reply. codemark. review. title 2.5. {{atOtherUser}} {{atUser}} (second reply, 1st codemark reply)'));
            },

            async () => {
                const review = await flow.createReview(
                    'review. title 3 (reviewers, tags)',
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris semper neque at erat aliquam luctus. Donec a viverra sapien, a facilisis arcu. Aenean eu metus vel leo suscipit suscipit a a nibh.',
                    ['{{atOtherUser}}'],
                    ['_blue', '_red', '_green', '_yellow']
                )
                const reply0 = await review.reply(new Reply('reply. review. title 3. {{atOtherUser}} {{atUser}} (first reply)'));
                await reply0.reply(new Reply('replying to reply. title 3. {{atOtherUser}} {{atUser}} (second reply)'));

                await review.reply(new Reply('reply. review. title 3. 1 {{atOtherUser}} {{atUser}} (third reply)'));
                await review.reply(new Reply('reply. review. title 3. 2 {{atOtherUser}} {{atUser}} (fourth reply)'));

                const reply2 = await review.reply(new CodemarkReply('codemark as reply. review. title 3. {{atOtherUser}} {{atUser}} (fifth reply, 1st codemark)'));
                reply2.reply(new Reply('reply. codemark. review. title 3. {{atOtherUser}} {{atUser}} (sixth reply, 1st codemark reply)'));
            }
        ];

        log.info(`There are ${operations.length} operations:`);
        for (let i = 0; i < operations.length; i++) {
            try {
                await (operations[i])();
            }
            catch (ex) {
                log.error(ex);
                if (program.failFast) {
                    throw ex;
                }
            }
            await sleep(250);
            log.debug(`Completed operation ${i + 1}`);
        }
        return 'ok';
    }
    try {
        // this is the main/program entry point
        var text = await main();
        log.debug(text);
    } catch (e) {
        log.error(e);
    }
})();
