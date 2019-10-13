# Unified Config File

We're moving our CodeStream sandbox configurations from setting configuration
parameters via environment variables to reading them from a single configuration
file shared by all CodeStream services (sandboxes).

During the migration, you should install (or reconfigure) your sandboxes to use
the `unified-cfg-file.sh` sandbox configuration file. Once we are satisfied
that all configurations work with the unified config file, this will become the
new default sandbox configuration (`default.sh`) and you'll need to reconfigure
your sandboxes to use that.

Follow normal procedures to install your sandboxes but for now add this
option when you execute the `db-sb-new-sandbox` command.
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

### Common Sandbox Environment Variables

These variables are optional

| Env Var | Description |
| --- | --- |
| CSSVC_CFG_FILE | configuration file and path |
| CSSVC_ENV | environment (value must be consistent with configuration file value) |
| CSSVC_CONFIGURATION | for determiniming configuration (eg. 'codestream-cloud', 'onprem-development', etc...) |


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

For non-local environments, config files are deployed according to a version
number which is kept with the schema (in
[codestream-configs](https://github.com/teamcodestream/codestream-configs)).
This number must be bumped each time the schema is updated.

When config files are deployed, they are deployed as
`config-file-name_<env>_<version>_.json`. WHen a sandbox is loaded, it will
locate the most recent config file for the sandbox's environment on the system
whose version is `<=` the schema version of the sandbox.

For example, say these config files are installed on a QA api host:
```
codestream-config_qa_3_.json       # app schema 3 thru 5
codestream-config_qa_6_.json       # app schema 6
codestream-config_qa_7_.json       # app schema 7 and greater
```
