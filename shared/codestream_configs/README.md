# CodeStream Configuration Templates

## Overview
A **config parameter schema file**, node library, utilities and profiles for
maintaining and deploying codestream configuration files.

- Intended to be used as a git submodule so use **develop** branch for
  everything.
- The config parameter definition file, **parameters.json**, defines all
  configuration parameters and the structure of the configuration file.
- **profiles/\*.json** define configuration profiles (codestream cloud
  environments, single host docker preview, mac development using pubnub,
  mac development using broadcaster, etc...)
- [README.parameter-definitions.json](README.parameter-definitions.json) -
  parameter descriptions and environment variables used to override the values
  in the file.
- Updates to the schema and/or profiles require downstream files and templates
  to be updated and deployed. Run `bin/update-all-configs` to refresh
  everything. This needs to be with access to the secrets database (KM_PKI needs
  to be defined or the key management sandbox loaded).
- If you update the schema or defaults, ALL projects that use this will need to
  be updated.


## Schema File

A schema file defines the superset of all parameters and structure that can be
included in generated configuration files.

### Parameter properties

| option | description |
| --- | --- |
| desc | (required) description of the config parameter |
| env | (optional) environment variable used to override the value in the config file |
| default | (optional) default value. If the default value is a string, it is interpolated so environment variables can be interpreted at runtime using the notation `"${HOME}/path/is/here"` |
| required | (optional, unused) true if parameter is required |
| envRequired | (optional, unused) true if environment variable is required |

### Repeating Blocks

If a section contains a property enclosed with `<` and `>` (eg. `<appProvider>`)
it defines a repeating block whose property key name is `appProvider`. In the
profile definition, you can specify N blocks with the same attributes whose only
requirement is that `appProvider` is unique across all the blocks)

## Profile File

A profile defines the scope of parameters to be included in a generated
configuration file (or template) based on the corresponding schema file.
Profiles may only contain references to blocks or variables that exist in the
schema and must follow the same structure.

When generating a configuration file or template from a profile and schema, you
can specify an environment as a way to clarify values within the generated
config file. This provides a mechanism for a single profile to yield N
configuration files, each with the same parameters and structure yet having
different values which corresspond to the different environments. This is
accomplished by including **environment blocks** in the profile where the
property is the name of the environment and the special property of
**defaultEnv** provides values when `environment` is not specified or
`environment` doesn't match any of those defined in the profile.

```
"section": {
    "subsection": {
        "prod": {
            ...values for `prod` environment
        },
        "defaultEnv": {
            ...values for all other environments
        }
    }
}
```

An empty block indicates that the defaults should be used from the schema.
```
"ssl": {}

"ssl": {
    "prod": {
        ...use these values for prod
    }
    // use defaults for all other environments
    "defaultEnv": {}
}
```
