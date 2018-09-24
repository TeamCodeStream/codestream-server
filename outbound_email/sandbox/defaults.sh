
# This file contains all the default variable settings for the sandbox.
# These settings should work on every developer's machine upon installation.

# There are 3 sandbox related variables that are pre-defined prior to
# sourcing in this file. They are:
#
#  CS_OUTBOUND_EMAIL_NAME     Name of the installed sandbox (installation specific)
#  CS_OUTBOUND_EMAIL_TOP      Path up to and including the sandbox's primary git project
#         (eg. this file is CS_OUTBOUND_EMAIL_TOP/sandbox/defaults.sh)
#  CS_OUTBOUND_EMAIL_SANDBOX  Path to the root directory of the sandbox tree


# Uncomment and setup if yarn is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/yarn-$DT_OS_TYPE-*
# export CS_OUTBOUND_EMAIL_YARN=true
# export CS_OUTBOUND_EMAIL_YARN_VER=latest
# export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/yarn/bin:$PATH


# Uncomment and setup if node is required. Available versions can be seen
# with the command:
#   ssh $DT_CLOUD_SERVER ls /home/web/SandboxRepos/software/node-$DT_OS_TYPE-*
export CS_OUTBOUND_EMAIL_NODE_VER=8.11.3
export PATH=$CS_OUTBOUND_EMAIL_SANDBOX/node/bin:$CS_OUTBOUND_EMAIL_TOP/node_modules/.bin:$PATH

# Uncomment if you want to short circuit the sandbox hooks (see hooks/git_hooks.sh)
# export CS_OUTBOUND_EMAIL_DISABLE_GIT_HOOKS=1

# Add sandbox utilities to the search path
export PATH=$CS_OUTBOUND_EMAIL_TOP/bin:$PATH

# Standard variables to consider using
export CS_OUTBOUND_EMAIL_LOGS=$CS_OUTBOUND_EMAIL_SANDBOX/log    # Log directory
export CS_OUTBOUND_EMAIL_TMP=$CS_OUTBOUND_EMAIL_SANDBOX/tmp     # temp directory
export CS_OUTBOUND_EMAIL_CONFS=$CS_OUTBOUND_EMAIL_SANDBOX/conf  # config files directory
export CS_OUTBOUND_EMAIL_DATA=$CS_OUTBOUND_EMAIL_SANDBOX/data   # data directory
export CS_OUTBOUND_EMAIL_PIDS=$CS_OUTBOUND_EMAIL_SANDBOX/pid    # pid files directory
[ -z "$CS_OUTBOUND_EMAIL_ASSET_ENV"] && export CS_OUTBOUND_EMAIL_ASSET_ENV=local

export CS_OUTBOUND_EMAIL_LAMBDA_NODE_VER=8.10

export CS_OUTBOUND_EMAIL_MONGO_DATABASE=codestream
export CS_OUTBOUND_EMAIL_MONGO_HOST=pdapi1.codestream.com
export CS_OUTBOUND_EMAIL_MONGO_PORT=47017
export CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL=300000
export CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY=pub-c-61c9ce67-e1fb-4a3d-87a2-3a30a2e8d8e9
export CS_OUTBOUND_EMAIL_PUBNUB_SECRET=sec-c-NmY4ODFkNjgtMzY1MC00NmNmLThkYmItZmJlYWUwOTY3MmEx
export CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY=sub-c-976e9836-f4a7-11e7-b8a6-46d99af2bb8c
export CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN=pd.codestream.com
export CS_OUTBOUND_EMAIL_SENDER_EMAIL=alerts@codestream.com
export CS_OUTBOUND_EMAIL_SENDGRID_SECRET=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
export CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT=600000
export CS_OUTBOUND_EMAIL_SQS=dev_pd_outboundEmail
export CS_OUTBOUND_EMAIL_SUPPORT_EMAIL=support@codestream.com
export CS_OUTBOUND_EMAIL_TO=""
