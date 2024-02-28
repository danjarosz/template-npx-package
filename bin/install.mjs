#!/usr/bin/env node
import {promisify} from "util";
import cp from "child_process";
import path from "path";
import fs from "fs";
import mv from "mv";

/**
 * convert libs to promises
 */
const exec = promisify(cp.exec);
const rm = promisify(fs.rm);

/**
 * Constants
 */
// TODO: update with the git repo of the package
const git_repo = "https://github.com/danjarosz/learn-npx-publish-package.git";
// TODO: update with the name of the package
const packageName = "template-npx-package";
const temporaryProjectName = "temp"

/**
 * Helper functions
 */

const exitWithError = () => {
    process.exit(1);
}

const handleLackOfAppName = () => {
    console.log("You have to provide a name to your app.");
    console.log("For example :");
    console.log(`    npx ${packageName} my-app`);
}

const getParams = (process) => {
    const extractInTheCurrentDirectory = process.argv[2] === ".";
    const projectName = extractInTheCurrentDirectory ? temporaryProjectName : process.argv[2];
    const currentPath = process.cwd();
    const projectPath = path.join(currentPath, projectName);

    return {
        projectName, projectPath, rootPath: currentPath, extractInTheCurrentDirectory
    }
}

const handleError = (error, projectPath) => {
    // clean up in case of error, so the user does not have to do it manually
    fs.rmSync(projectPath, {recursive: true, force: true});
    console.log(error);
}

const createProjectDirectory = (projectPath, projectName) => {
    const isProjectPathAlreadyExist = fs.existsSync(projectPath);

    if (isProjectPathAlreadyExist) {
        console.log(`The file or directory "${projectName}" already exist in the current directory, please give it another name.`);
        exitWithError();
    } else {
        fs.mkdirSync(projectPath);
    }
}

const showInstallationDoneInfo = (projectName, extractInTheCurrentDirectory) => {
    console.log("The installation is done!");

    if (!extractInTheCurrentDirectory) {
        console.log("You can now run your app with:");
        console.log(`    cd ${projectName}`);
    }
}


const installDependencies = async () => {
    await exec("npm install");
}

const uninstallUnnecessaryDependencies = async () => {
    // remove the packages needed for cli
    await exec("npm uninstall mv");
}

const getRepoFromGitHub = async (projectPath) => {
    // clone the repo into the project folder -> creates the new boilerplate
    await exec(`git clone --depth 1 ${git_repo} ${projectPath} --quiet`);

    // remove my git history
    const rmGit = rm(path.join(projectPath, ".git"), {recursive: true, force: true});
    // remove the installation file
    const rmBin = rm(path.join(projectPath, "bin"), {recursive: true, force: true});
    await Promise.all([rmGit, rmBin]);
}

const setWorkingDir = (process, projectPath) => {
    process.chdir(projectPath);
}

const moveFilesToRootDir = (oldPath, newPath) => {
    mv(oldPath, newPath, {mkdirp: false, clobber: false}, (err) => {
        if (err) {
            throw err;
        }
    });
}

/**
 * Script
 */

const run = async (process) => {
    const isNotEnoughArgumentsProvided = process.argv.length < 3;
    if (isNotEnoughArgumentsProvided) {
        handleLackOfAppName();
        exitWithError();
    }
    const {projectName, projectPath, rootPath, extractInTheCurrentDirectory} = getParams(process);
    createProjectDirectory(projectPath, projectName);

    try {
        await getRepoFromGitHub(projectPath);
        setWorkingDir(process, projectPath);
        await uninstallUnnecessaryDependencies();
        await installDependencies();

        if (extractInTheCurrentDirectory) {
            setWorkingDir(process, rootPath);
            moveFilesToRootDir(projectPath, rootPath)
        }

        showInstallationDoneInfo(projectName, extractInTheCurrentDirectory);
    } catch (error) {
        handleError(error, projectPath);
    }
}

await run(process);
