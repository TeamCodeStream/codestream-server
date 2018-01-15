This is the inbound email server. It handles email files deposited in a directory
by our mail server (Postfix), and digests them for use by CodeStream. It reads
and parses the mail files, does some processing, then sends them to the API server
using a special http call.

This repo should be used within the context of the dev_tools sandbox model. You
should install it as a working sandbox and load the sandbox into your shell's
environment before launching any of the services.

Git hooks and submodules are initialized and maintained through hooks which will
be setup up installation.   See the dev_tools readme for more information concerning
sandboxes.

Configuration settings are primarily defined in the *sandbox/defaults.sh* file.
The sandbox type, environment variable & command prefix is *cs_mailin*.

*DO NOT USE NPM TO MANAGE THIS REPO.  USE YARN.*  New npm modules should be installed
with the *yarn install $module* command. Building node_modules from the package.json file
should be done with *yarn install --frozen-lockfile*


Sandbox commands:

* *cs_mailin-help* will list all commands in the sandbox
* *cs_mailin-service* is the init script to start, stop and manage the inbound_email
  service.
* *cs_mailin-local-poller* is meant to run on a local development machine. It will
  poll the inbound cloud mail server for new messages and copy them to your local
  queue. Be aware that this does not support more than one developer using a
  mail server.
