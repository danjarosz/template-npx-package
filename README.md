# NPX Template Package

The following is a template for creating an NPM package which can be run using `npx` command.

## How to use:
1. Copy `bin` directory to your project.
2. Change constants `git_repo` and `packageName` in `install.mjs` to your own.
3. Update `package.json` with the following:
```
"bin": {
    "your-package-name": "bin/install.mjs"
  }
```
NOTE: `your-package-name` is required to be the same as the name of your project