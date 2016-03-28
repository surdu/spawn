# Welcome to Spawn

Spawn is a basic tool that helps you start your projects easily using simple templates.

Majority of project templates just need files copied from a template folder and replace placeholders inside files throughout that folder with certain project specific value (e.g: project name, project version, etc).

Enter Spawn: put a template folder on GitHub (for now), add a config file to that folder enumerating the variables to replace throughout the folder and you're set.

Every time you'll need a new project based on that template, just call `spawn <GitHubUser>/<GitHubRepo>`. Spawn will prompts you to enter values for template variables defined in the config and you're good to go.

# Installation

In order to use Spawn you'll need [Node](https://nodejs.org) and npm, which usually comes bundled with Node.

After installing Node and npm, just run the following command:

```
npm install spawn-cli -g
```

On Unix machines, depending on your system configuration, you might need to run the above command using `sudo`.

# Usage

I've setup a repo to help you see Spawn in action and how easy is to set-up a template repo: [hello-spawn](https://github.com/surdu/hello-spawn)

You can see that there is a config file named `spawn.json` that contains one key `values` and it's value is an object of which the keys are the variable names and the values are the default for the variable names.

Now let's spawn an instance of `hello-spawn` on your machine.

Go inside an empty folder on your disk and type the following command:

```
spawn surdu/hello-spawn
```

You'll notice that spawn will start asking you your name and the version, as specified in the config.

After you provide all this info, you'll have a fresh copy of the `hello-spawn` project spawned in your current folder.

This is pretty much alt there is to it, for now at least.
