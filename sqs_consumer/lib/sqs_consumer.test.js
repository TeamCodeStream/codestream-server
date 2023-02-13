"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sqs_consumer_1 = require("./sqs_consumer");
const jest_mock_extended_1 = require("jest-mock-extended");
const globals_1 = require("@jest/globals");
describe("sqs_consumer", () => {
    (0, globals_1.test)("rejects invalid message", () => {
        const logger = (0, jest_mock_extended_1.mock)();
        const listener = (0, jest_mock_extended_1.mock)();
        const client = (0, jest_mock_extended_1.mock)();
        const invalidMsg = {
            Messages: [
                {
                    Body: JSON.stringify({
                        type: "blah",
                    }),
                    ReceiptHandle: "blahblah",
                },
            ],
        };
        const subject = new sqs_consumer_1.SqsConsumer("https://blah", logger, listener, client);
        const toDelete = [];
        subject.processMessage(invalidMsg, toDelete);
        (0, globals_1.expect)(toDelete).toHaveLength(0);
        (0, globals_1.expect)(logger.warn).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(logger.warn).toHaveBeenCalledWith("Skipping message with no Body.Message");
    });
    (0, globals_1.test)("rejects message with invalid type", () => {
        const logger = (0, jest_mock_extended_1.mock)();
        const listener = (0, jest_mock_extended_1.mock)();
        const client = (0, jest_mock_extended_1.mock)();
        const invalidMsg = {
            Messages: [
                {
                    Body: JSON.stringify({
                        Message: JSON.stringify({
                            type: "user.explode",
                        }),
                    }),
                    ReceiptHandle: "blahblah",
                },
            ],
        };
        const subject = new sqs_consumer_1.SqsConsumer("https://blah", logger, listener, client);
        const toDelete = [];
        subject.processMessage(invalidMsg, toDelete);
        (0, globals_1.expect)(logger.warn).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(logger.warn).toHaveBeenCalledWith("Received unhandled message user.explode undefined");
    });
    (0, globals_1.test)("processes valid message", () => {
        const logger = (0, jest_mock_extended_1.mock)();
        const listener = (0, jest_mock_extended_1.mock)();
        const client = (0, jest_mock_extended_1.mock)();
        const innerMessage = {
            id: "1234",
            type: "user.update",
            version: "1.0",
            meta: {
                occurredAt: 1234,
                summary: "whatever",
                originatingService: "user",
            },
            data: {
                type: "user.update",
                targetType: "user",
                version: "1.0",
                target: {
                    id: "1234",
                    user_tier_id: 1,
                    group_ids: [],
                    name: "bob",
                    active: true,
                    email: "test@newrelic.com",
                    created_at: 1234,
                    updated_at: 2234,
                    // external_id: "2234",
                    username: "bob`",
                },
            },
        };
        const invalidMsg = {
            Messages: [
                {
                    Body: JSON.stringify({
                        Message: JSON.stringify(innerMessage),
                    }),
                    ReceiptHandle: "blahblah",
                },
            ],
        };
        const subject = new sqs_consumer_1.SqsConsumer("https://blah", logger, listener, client);
        const toDelete = [];
        subject.processMessage(invalidMsg, toDelete);
        (0, globals_1.expect)(toDelete).toHaveLength(1);
        (0, globals_1.expect)(logger.warn).toHaveBeenCalledTimes(0);
        (0, globals_1.expect)(listener.onUserUpdate).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(listener.onUserUpdate).toHaveBeenCalledWith(innerMessage);
    });
});
//# sourceMappingURL=sqs_consumer.test.js.map