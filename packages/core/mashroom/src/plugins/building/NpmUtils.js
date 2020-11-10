// @flow

import {exec} from 'child_process';
import type {MashroomLogger, MashroomLoggerFactory} from '../../../type-definitions';

type NpmCommand = 'install' | 'update' | 'run';

const EXECUTION_TIMEOUT = 3 * 60 * 1000; // 3min

/**
 * Encapsulate npm access
 */
export default class NpmUtils {

    _log: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._log = loggerFactory('mashroom.plugins.build');
    }

    /**
     * Run install in given package path
     *
     * @param {string} packagePath
     * @return {Promise<void>}
     */
    install(packagePath: string): Promise<void> {
        return this._npmExecute(packagePath, 'install');
    }

    /**
     * Run update in given package path
     *
     * @param {string }packagePath
     * @return {Promise<void>}
     */
    update(packagePath: string): Promise<void> {
        return this._npmExecute(packagePath, 'update');
    }

    /**
     * Run a script in given package path
     *
     * @param {string} packagePath
     * @param {string} script
     * @return {Promise<void>}
     */
    runScript(packagePath: string, script: string): Promise<void> {
        return this._npmExecute(packagePath, 'run', script);
    }

    _npmExecute(packagePath: string, command: NpmCommand, ...args: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const commandString = `npm ${command} ${args.join(' ')}`;

            const execOptions = {
                cwd: packagePath,
                timeout: EXECUTION_TIMEOUT,
                windowsHide: true,
            };

            // Execute in a child process
            const childProc = exec(commandString, execOptions, (error, stdout, stderr) => {
                if (error) {
                    const stdErrStr = stderr.toString();
                    if (stdErrStr) {
                        this._log.error(stdErrStr);
                    }
                    if (childProc.killed) {
                        reject(new Error(`Execution of command '${commandString}' aborted because it took longer than ${EXECUTION_TIMEOUT / 1000}sec!`));
                    } else {
                        reject(error);
                    }
                    return;
                }

                this._log.debug(`Execution of command '${commandString}' in ${packagePath} successful`);
                this._log.debug(stdout.toString());
                resolve();
            });

            this._log.debug(`Executing command '${commandString}' in ${packagePath} in child process: ${childProc.pid}`);
        });
    }
}
