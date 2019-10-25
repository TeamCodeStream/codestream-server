# Unified Config File

All CodeStream services share a single unified configuration file which obeys a
schema ([defined here](https://github.com/TeamCodeStream/codestream-configs)).
Because it changes over time, the schema and config files are versioned.

### CodeStream Configurations

CodeStream's server-side services can be configured in different arrangements,
referred to as codestream configurations. The `dt-update-secrets` command
installs two configurations for local development. `codestream-cloud` is a ready
to go, out-of-the-box, configuration that mimicks production with mongo, api
(using pubnub) mailin, mailout (lambda or vm, using sendgrid) & AWS SQS services.
`onprem-development` is a template for the arrangement we use for onprem which
includes mongo, api (using braodcaster), mailin, mailout (using NodeMail), the
broadcaster & rabbitMQ.

You can create any configuration you want, derived from these or from scratch.
What's important is that you know what configurations are available to you.

#### The configuration file directory (~/.codestream/config)

Config files, templates and control files all reside in _~/.codestream/config_.
The config files and templates are versioned so you'll see the number of files
increase over time. You can delete the old ones but remember that if you
checkout an old version of a sandbox, it may want a configuration file from
days past.

Configuration files match the pattern
`<configuration-name>_<env>_<version>_.json`. Templates are similarly
named `<configuration-name>_<env>_<version>_.json.template`.

There are two special files in this directory that you will create
and maintain. `codestream-cfg-default.local` will contain the
name of the configuration you want to use when your sandboxes
are loaded (eg. **codestream-cloud** or **onprem-development**).
`codestream-cfg-update-hook` is a list of mappings that the
`dt-update-secrets` command will use to maintain versions of your
custom configurations over time.

#### Select a configuration
To select which configuration file your sandboxes use for local development,
update `codestream-cfg-default.local`. This command indicates you
want the _out-of-the-box_ `codestream-cloud` config.
```
$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
```


### Stting up your configurations

#### Out-of-the-box codestream-cloud configuration
If you want to use the out-of-the-box **coudstream-cloud** configuration (note
that email is suppressed in this config), you don't have to do anything. Just
install it with:
```
$ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
```

#### Customized out-of-the-box codestream-cloud configuration
If you want to customize the out-of-the-box **codestream-cloud** (or any other)
configuration, choose a configuration name for it (_my-cs-config_ for example)
and follow these directions:

* Change to the config file directory: `cd ~/.codestream/config`

* Copy latest `codestream-cloud_local_{N}_.json` to `my-cs-config_local_{N}_.json`
    ```
    $ latestFile=`ls ~/.codestream/config/codestream-cloud_local_*_.json|tail -1`
    $ latestVersion=`basename $latestFile | cut -f3 -d_`
    $ # remember to substitute your config name for 'my-cs-config'
    $ cp $latestFile ~/.codestream/config/my-cs-config_local_${latestVersion}_.json
    ```

* Edit `~/.codestream/config/my-cs-config_local_${latestVersion}_.json` to taste

* Register your file so an update hook will carry your changes forward when new
  versions of the config file are downloaded (`dt-update-secrets`). The update
  hook is a list of 'configuration_file -> custom_configuration_file' mappings.
  This command appends your new mapping to it.
	```
	$ echo "codestream-cloud:my-cs-config" >> ~/.codestream/config/codestream-cfg-update-hook
	```

* Configure my-cs-config as your default codestream config
	```
	$ echo my-cs-config > ~/.codestream/config/codestream-cfg-default.local
	```

#### Customize the onprem-development configuration template

If you want to use the **onprem-development** cloud configuration:

* Change to the config file directory: `cd ~/.codestream/config`

* Copy the latest `onprem-development_local_{N}_.json.template` to
  `onprem-development_local_{N}_.json`
    ```
    $ latestFile=`ls ~/.codestream/config/onprem-development_local_*_.json.template|tail -1`
    $ latestVersion=`basename $latestFile | cut -f3 -d_`
    $ cp $latestFile ~/.codestream/config/onprem-development_local_${latestVersion}_.json
    ```

* Edit the `~/.codestream/config/onprem-development_local_${latestVersion}_.json` to taste

* Add the file to a hook that carries your changes forward when the config file
  is updated. The update hook is a list of configurations, not just one.
	```
	$ echo onprem-development:onprem-development >> ~/.codestream/config/codestream-cfg-update-hook
	```

* Configure onprem-development as your default codestream config
	```
	$ echo onprem-development > ~/.codestream/config/codestream-cfg-default.local
	```

### Managing the Configuration Files
1. Look in your **~/.codestream/config/** directory. You'll find config files
   (ending in `.json`) and templates (ending in `.json.template`). The list of
   config files and templates will grow over time. Consider these read-only.
   They are overwritten whenever you run `dt-update-secrets`.

   Config files (`.json`) are fully functional and can be used directly where as
   templates (`.json.template`) must be copied to the corresponding `.json` file
   suffix and edited to replace the template variables within
   `{{TEMPLATE_VAR_EXAMPLE}}`.

   The `dt-merge-json` script can be used to integrate on-going updates of the
   deployed config files and templates with your working copy. It will ensure
   all properties from the _new file_ are merged into the _existing file_ but
   will retain pre-existing values from the _existing file_. It's got limited
   abilities but should suffice for maintaining most config file updates.

1. To accomodate versioning of the config file schema (see below) as well as
   selecting an environment, the default sandbox behavior will try to find the
   most appropriate config file with those two attributes in mind.
   Thusly, the config files are deployed as follows:
   ```
   codestream-cloud_local_2_.json
   onprem-development_local_2_.json.template
   ```
   or more generally,
   ```
   <configuration-name>_<env>_<schema-version>.json.*
   ```
   where `local` represents the environment and `2` represents the schema
   version number [stored
   here](https://github.com/TeamCodeStream/codestream-configs/blob/develop/parameters.preview).
   This value will change over time and you will end up with numerious
   `codestream-cloud_local_*_json` (eg) files. That's normal.

1. The `unified-cfg-file.sh` sandbox configuration will look for a configuration
   file called **~/.codestream/config/codestream-services-config.json** as a
   last resort. One option for maintaining your config file is to manage this
   symbolic link yourself.
   ```
   $ cd ~/.codestream/config
   $ ln -snf <the-config-file-you-want.json> codestream-services-config.json
   $ ls -l
   ```
   You must set the link **_before_** loading any sandboxes.  If they're already
   loaded, kill those terminals and fire up new ones and reload after you've set
   the link.

1. Alternatively you can create this special file to indicate that you want the
   _proper_ config schema version for a particular configuration. For example,
   if you're running the `codestream-cloud` config on your development computer,
   this will tell the sandboxes to look for the most recent schema version
   config for a given repo.
   ```
   $ echo codestream-cloud > ~/.codestream/config/codestream-cfg-default.local
   ```

The shell function that applies this selection algorythm is called
_sandutil_get_codestream_cfg_file()_ and can be found in
[dev_tools/lib/sandbox_utils.sh](https://github.com/TeamCodeStream/dev_tools/blob/master/lib/sandbox_utils.sh)

### Distributed Configuration Files and Templates
Files distributed via `dt-update-secrets`.

| File | Desc |
| --- | --- |
| codestream-cloud | intended to go into production (pubnub, sendgrid, sqs) |
| onprem-development | for development of the CodeStream On-Prem service (broadcaster, nodemailer, rabbitmq) |


### Config file Version

Config files are deployed according to a version number which is kept with the
schema (in
[codestream-configs](https://github.com/teamcodestream/codestream-configs)).
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

### Common Sandbox Environment Variables

You shouldn't need to use these for local development, but you should be aware
of them.

| Env Var | Description |
| --- | --- |
| CSSVC_CFG_FILE | configuration file and path |
| CSSVC_ENV | environment (value must be consistent with configuration file value) |
| CSSVC_CONFIGURATION | for determiniming configuration (eg. 'codestream-cloud', 'onprem-development', etc...) |


## Migration Notes

We're moving our CodeStream sandbox configurations from setting configuration
parameters via environment variables to reading them from a single configuration
file shared by all CodeStream services (sandboxes).

During the migration, you should install (or reconfigure) your sandboxes to use
the `unified-cfg-file.sh` sandbox configuration file. Once we are satisfied
that all configurations work with the unified config file, this will become the
new default sandbox configuration (`default.sh`) and you'll need to reconfigure
your sandboxes to use that.

[Follow normal procedures](README.md#quick-start) to install your sandboxes but
for now add this option when you execute the `db-sb-new-sandbox` command.
```
-e unified-cfg-file.sh
```
Or if you are reconfiguring existing sandboxes, from with a shell
that does *NOT* have any sandboxes loaded, run:
```
$ dt-sb-configure -R -n <sandbox-name> -e unified-cfg-file.sh
```

### TL;DR - Initial migration steps
1. If you're using dev_tools on your own computer, bring it up to date
   (`dt-selfupdate -y`). Always keep your dev_tools installation updated. This
   does not apply to our managed EC2 instances, which are kept updated
   automatically.
1. Update your secrets (`dt-update-secrets`).
1. Look in your _~/.codestream/config/_ directory. You'll see a **README**
   file with instructions for different scenarios.
1. Update your existing sandbox configurations to use, or install new sandboxes
   configured with, the `unified-cfg-file.sh` configuration.  Use
   `dt-sb-new-sandbox` to install the sandboxes or `dt-sb-configure` to change
   an existing sandbox's config.
