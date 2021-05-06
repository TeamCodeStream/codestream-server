# API Server Build Information

TeamCity Project: [API](http://redirector.codestream.us/builds/api)

## GitFlow and Brief Overview
Read the [Build Overview](https://redirector.codestream.us/ops/workflows) page on the Ops Wiki site.

## Assets

| Type | Desc |
| --- | --- |
| info | asset info file |
| tgz | tarball of repo following an **npm install** for x86_64 |
| docker image | docker images are only stored in dockerhub repos |

| Asset Env | Asset | Branch | Location |
| --- | --- | --- | --- |
| dev | tgz | develop | [Asset server (dev/api-server)](http://assets.codestream.us/artifacts/dev/api-server/) |
| prod | tgz | master | [Asset server (prod/api-server)](http://assets.codestream.us/artifacts/prod/api-server/) |
| dev | docker image | develop | Published to dockerhub as [teamcodestream/api-onprem-dev](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/api-onprem-dev) |
| prod | docker image | master | Published to dockerhub as [teamcodestream/api-onprem](https://cloud.docker.com/u/teamcodestream/repository/docker/teamcodestream/api-onprem) |

## Build Documentation

[TeamCity build documentation](https://github.com/TeamCodeStream/teamcity_tools/tree/master/docs)
