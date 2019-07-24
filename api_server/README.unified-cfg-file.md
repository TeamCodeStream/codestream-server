# Unified Config File

We're moving our sandbox configurations from setting configuration parameters
from environment variables to getting them from a single shared configuration
file.

As sandboxes are modified to support this, they should re-configured (or
installed) using the `unified-cfg-file.sh` sandbox configuration file. When we
are satisfied that all configurations work with the unified config file, this
will become the new default sandbox configuration `default.sh`.

## Migrations

### Prepare
1. Bring your development environment, including dev_tools, up to date
   (`dt-selfupdate -y`).
1. Update your secrets (`dt-update-secrets`)

### Configuration Files
1. Look in the **~/.codestream/config/** directory. You'll find a config file
   and a template. The list of config files and templates will grow over time.
   Consider these read-only.

   Config files (ending in `.json`) are fully functional and can be used
   directly where as templates should be _copied_ to the corresponding `.json`
   file suffix and edit to replace the template variables `{{TEMPLATE_VAR}}`.

1. The default behavior for sandboxes configured with `unified-cfg-file.sh` is
   to look for a configuration file called
   **~/.codestream/config/codestream-services-config.json**. Make this a
   symbolic link to switch between the various configurations on your system.
   ```
   $ cd ~/.codestream/config
   $ ln -snf <the-config-file-you-want.json> codestream-services-config.json
   $ ls -l
   ```
1. Setup a link for the configuration file you want before proceeding.


### Distributed Config Files and Templates

Files distributed via `dt-update-secrets`.

| File | Desc |
| --- | --- |
| local-cloud-development.json | for running development sandboxes natively on your computer targeted for the production configuration (pubnub, sendgrid, sqs) |
| local-onprem-development.json.template | for creating a config running development sandboxes natiely on your computer targeted for the on-prem (docker) configuration (broadcaster, nodemailer, rabbitmq) |


### Setup an API sandbox (and playground)

1. Typically the API playground has a mongo sandbox and an api sandbox. Copy
   your api playground to `uapi` (api with unified config)
	```
	$ cp $DT_PLAYGROUNDS/<existing-api-playground> $DT_PLAYGROUNDS/uapi
	```
1. Edit **$DT_PLAYGROUNDS/uapi** and change the name of the `api` sandbox to
   `uapi`
1. In a new shell, load your mongo sandbox and install a new api sandbox
	```
	$ dt-load mongo
	$ dt-sb-new-sandbox -yCD -t cs_api -n uapi -e unified-cfg-file.sh -b config_update
	```
1. Load the playground file to test it (it should complain about the mongo
   sandbox being loaded)
	```
	$ dt-load-playground uapi
	```
1. If you are running a configuration that requires rabbit, you'll **docker**
   installed and you need to run a pre-configured rabbit container.
   ```
   $ # On a mac:
   $ docker run -d -p 5672:5672 --name csrabbitmq teamcodestream/rabbitmq-onprem:0.0.0
   ```
1. Start your api service as normal. If you set CS_API_SHOW_CFG, it will dump
   the exported configuration parameters to stdout (`export CS_API_SHOW_CFG=1`)
