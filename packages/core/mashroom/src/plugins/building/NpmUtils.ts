
import {exec} from 'child_process';
import type {MashroomLogger, MashroomLoggerFactory} from '../../../type-definitions';

type NpmCommand = 'install' | 'update' | 'run';

const DEFAULT_NPM_EXECUTION_TIMEOUT_SEC = 3 * 60; // 3min

/**
 * Encapsulate npm access
 */
export default class NpmUtils {

    private _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory, private _npmExecutionTimeoutSec = DEFAULT_NPM_EXECUTION_TIMEOUT_SEC) {
        this._logger = loggerFactory('mashroom.plugins.build');
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

    private _npmExecute(packagePath: string, command: NpmCommand, ...args: Array<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            const commandString = `npm ${command} ${args.join(' ')}`;

            const execOptions = {
                cwd: packagePath,
                timeout: this._npmExecutionTimeoutSec * 1000,
                windowsHide: true,
            };

            // Execute in a child process
            const childProc = exec(commandString, execOptions, (error, stdout, stderr) => {
                if (error) {
                    const stdErrStr = stderr.toString();
                    if (stdErrStr) {
                        this._logger.error(stdErrStr);
                    }
                    if (childProc.killed) {
                        reject(new Error(`Execution of command '${commandString}' aborted because it took longer than ${this._npmExecutionTimeoutSec}sec!`));
                    } else {
                        reject(error);
                    }
                    return;
                }

                this._logger.debug(`Execution of command '${commandString}' in ${packagePath} successful`);
                this._logger.debug(stdout.toString());
                resolve();
            });

            this._logger.debug(`Executing command '${commandString}' in ${packagePath} in child process: ${childProc.pid}`);
        });
    }
}
