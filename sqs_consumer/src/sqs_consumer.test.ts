import { SqsConsumer } from "./sqs_consumer";
import { Logger, SqsMessageListener, UserUpdateMessage } from "./types";
import { mock } from "jest-mock-extended";
import { SQS } from "aws-sdk";
import { expect, test } from "@jest/globals";

describe("sqs_consumer", () => {
  test("rejects invalid message", () => {
    const logger = mock<Logger>();
    const listener = mock<SqsMessageListener>();
    const client = mock<SQS>();

    const invalidMsg: SQS.ReceiveMessageResult = {
      Messages: [
        {
          Body: JSON.stringify({
            type: "blah",
          }),
          ReceiptHandle: "blahblah",
        },
      ],
    };

    const subject = new SqsConsumer("https://blah", logger, listener, client);
    const toDelete: string[] = [];
    subject.processMessage(invalidMsg, toDelete);
    expect(toDelete).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Skipping message with no Body.Message"
    );
  });

  test("rejects message with invalid type", () => {
    const logger = mock<Logger>();
    const listener = mock<SqsMessageListener>();
    const client = mock<SQS>();

    const invalidMsg: SQS.ReceiveMessageResult = {
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

    const subject = new SqsConsumer("https://blah", logger, listener, client);
    const toDelete: string[] = [];
    subject.processMessage(invalidMsg, toDelete);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Received unhandled message user.explode undefined"
    );
  });

  test("processes valid message", () => {
    const logger = mock<Logger>();
    const listener = mock<SqsMessageListener>();
    const client = mock<SQS>();

    const innerMessage: UserUpdateMessage = {
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

    const invalidMsg: SQS.ReceiveMessageResult = {
      Messages: [
        {
          Body: JSON.stringify({
            Message: JSON.stringify(innerMessage),
          }),
          ReceiptHandle: "blahblah",
        },
      ],
    };

    const subject = new SqsConsumer("https://blah", logger, listener, client);
    const toDelete: string[] = [];
    subject.processMessage(invalidMsg, toDelete);
    expect(toDelete).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledTimes(0);
    expect(listener.onUserUpdate).toHaveBeenCalledTimes(1);
    expect(listener.onUserUpdate).toHaveBeenCalledWith(innerMessage);
  });
});
