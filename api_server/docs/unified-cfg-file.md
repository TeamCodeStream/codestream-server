# Unified Config File

All CodeStream services share a single unified configuration file which obeys a
schema ([defined here](../../shared/codestream_configs/)).
Because it changes over time, the schema and config files are versioned.

## CodeStream Configurations

CodeStream's server-side services can be configured in different arrangements,
referred to as _codestream configurations_. For dev\_tools framework developer
sandboxes, the `dt-dev-update-secrets` command installs ready-to-go
configurations and configuration templates for getting started with _local_
development.

_Take note that **local** is the value for your sandbox's run-time environment
(config file property: **sharedGeneral.runTimeEnvironment**, env var:
**CSSVC_ENV**)._ This is one of those properties used by the dev\_tools
framework software for all kinds of things.

### Ready-To-Go Configurations and Templates

| File | Desc |
| --- | --- |
| codestream-cloud | (ready-to-go) production-like config with mongo, api using pubnub, mailin, mailout using sendgrid (as a lambda func or sandbox) & AWS SQS services. |
| onprem-development | (ready-to-go) on-prem-like config with mongo, api using the braodcaster, mailin, mailout using NodeMail pointing to our internal mailhub, the broadcaster & rabbitMQ services. |

Templates are similar to the **ready-to-go** configurations except you _must_
add custom properties to them via an update hook before they can be used.
Templates will have the extension **.template**.

You can create as many configurations as you want, derived from these or wholly
from scratch. Primarily important is that you know what configurations are
available for your development.


### Configuration File Directory (~/.codestream/config/)

Config files, templates and control files all reside in _~/.codestream/config/_.
The config files and templates are versioned with a schema number so you'll see
the number of files increase over time. You can delete the old ones but remember
that if you checkout an old version of your sandbox's repo, it may want a
configuration file from days past.

**Configuration file names** match the pattern
`<configuration-name>_<env>_<version>_.json`. Templates have the word
**template** in their configuration name and cannot be used verbatim with a
sandbox, however they are processed by the update hook exactly the same way
ready-to-go configurations are.

**There are two special files in this directory** that you will create and
maintain. Good default examples (extension **.example-N**) are distributed with
the config files so you you can copy them into place if you so desire.

1. `codestream-cfg-default.local` contains the name of the default configuration
you want to use when your sandboxes are configured with **CSSVC_ENV=local** (eg.
**codestream-cloud**, **my-custom-config-1**, **onprem-development**, etc...).

1. `codestream-cfg-update-hook` is a list of mappings that the
`dt-dev-update-secrets` command will use to maintain versions of your custom
configurations over time.


### Select a default configuration

To select which configuration your sandboxes use for local development, update
`codestream-cfg-default.local`. This command indicates you want the
`codestream-cloud` config.
```
$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
```
You can change this at any time. Remember, you will need to stop and restart
your sandboxes when you make a change as the config file is only read when the
processes are started.


### Customizing the ready-to-go configurations

If you are using the ready-to-go configurations as is, you do not need to set
up the hook file.  However if you want to customize one or more of them or if
you are using one of the templates, you will need to setup records in your
update hook to ensure they're maintained over time.

Each record in the hook file represents the creation of one custom configuration
file. The hook file name is `~/.codestream/config/codestream-cfg-update-hook`.

Lines beginning with a `#` will be ignored.

Each record (line) in the file is a list of colon (`:`) delimeted fields.

1. The first field is the name of the source configuration (usually one of the
   configurations downloaded with the `dt-dev-update-secrets` command).

2. The second field is the name of your custom configuration.

3. The third field is the name of your static custom properties file with which
   you want to override values in the source configuration.

For example, say you want to override the slack app you use for development when
working with the **codestream-cloud** configuration.

1. First, create a static custom properties file with your values. Place the
   file in the _~/.codestream/config/_ directory. Let's call it
   _my-custom-cloud-props.json_.  It's contents would look like this:
   ```
   {
    "integrations": {
      "slack": {
        "slack.com": {
          "appClientId": "my-client-id",
          "appClientSecret": "my-client-secret",
          "appSharingClientId": "my-client-id",
          "appSharingClientSecret": "my-client-secret",
          "appSharingSigningSecret": "my-signing-secret",
          "appSigningSecret": "my-signing-secret",
          "appStrictClientId": "my-client-id",
          "appStrictClientSecret": "my-client-secret",
          "appStrictSigningSecret": "my-signing-secret",
          "interactiveComponentsEnabled": true
        }
      }
    }
   }
   ```

1. Choose a custom configuration name for your new configuration. For example,
   _my-cloud-config_.

1. Add the following record to your hook file.
   ```
   echo "codestream-cloud:my-cloud-config:my-custom-cloud-props.json" >> ~/.codestream/config/codestream-cfg-update-hook
   ```
1. If you want your custom configuration to be your default for local
   development, type this:
   ```
   echo my-cloud-config > ~/.codestream/config/codestream-cfg-default.local
   ```

Now, every time you update your secrets & configs with `dt-dev-update-secrets`, the
hook will carry your custom properties forward into the latest version of the
config.


## Deeper Look at the Configuration Files and Sandbox Setup

### Config and Template File Naming Conventions and Versioning

To accomodate versioning of the config file schema as well as selecting an
environment, the default sandbox behavior will try to find the most appropriate
config file with those two attributes in mind. Thusly, the config files are
deployed as follows:
```
codestream-cloud_local_2_.json
onprem-development_local_2_.json
```
or more generally,
```
<configuration-name>_<env>_<schema-version>.json
```
where `local` represents the environment and `2` represents the schema version
number [stored here]( ../../shared/codestream_configs/parameters.version). This
value will change over time so you will end up with numerious
`codestream-cloud_local_*_json` (eg) files, each matched to a particular schema
version of the code base.

When a codestream sandbox is loaded it will locate the best matching version of
the config file that corressponds to the schema version in the git repo. If no
environment is specified (`CSSVC_ENV`), it assumes _**local**_. If no
configuration is specified (`CSSVC_CONFIGURATION`) it uses whatever is set in
the `~/.codestream/config/codestream-cfg-default.{env}` file for that
environment.

You can override this by setting `CSSVC_CFG_FILE` to the actual config file you
want to use before loading the sandboxes.

To set your default codestream configuration for the local environment,
update the default configuration file. For example, if you want the
**codestream-cloud** _codestream configuration_ as the default for the
_local_ environment, run:
```
$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
```

The shell function that applies this selection algorythm is called
_sandutil_get_codestream_cfg_file()_ and can be found in
[dev_tools/lib/sandbox_utils.sh](https://github.com/TeamCodeStream/dev_tools/blob/master/lib/sandbox_utils.sh)



### Config file Version

Config files are deployed according to a version number which is kept with the
schema (in
[codestream_configs](https://github.com/teamcodestream/codestream_configs)).
This number must be bumped each time the schema is updated.

When config files are deployed, they are deployed as
`<configuration-name>_<env>_<version>_.json`. WHen a sandbox is loaded, it will
locate the most recent config file for the sandbox's environment on the system
whose version is `<=` the schema version of the sandbox.

For example, say these config files are installed on a QA api host:
```
codestream-config_qa_3_.json       # app schema 3 thru 5
codestream-config_qa_6_.json       # app schema 6
codestream-config_qa_7_.json       # app schema 7 and greater
```

### Environment Variables

You shouldn't need to use these for local development, but you should be aware
of them.

| Env Var | Description |
| --- | --- |
| CSSVC_CFG_FILE | configuration file and path |
| CSSVC_ENV | environment (value must be consistent with configuration file value) |
| CSSVC_CONFIGURATION | for determiniming configuration (eg. 'codestream-cloud', 'onprem-development', etc...) |
