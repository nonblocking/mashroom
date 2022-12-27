
import {exec} from 'child_process';
import type {MashroomLogger, MashroomLoggerFactory} from '../../../type-definitions';

type NpmCommand = 'install' | 'run';

const DEFAULT_NPM_EXECUTION_TIMEOUT_SEC = 3 * 60; // 3min

/*
 * npm execution utils
 */
export default class NpmUtils {

    private _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory, private _npmExecutionTimeoutSec = DEFAULT_NPM_EXECUTION_TIMEOUT_SEC) {
        this._logger = loggerFactory('mashroom.plugins.build');
    }

    /*
     * Run install in given package path
     */
    async install(packagePath: string) {
        return this._npmExecute(packagePath, 'install');
    }

    /*
     * Run a script in given package path
     */
    async runScript(packagePath: string, script: string) {
        return this._npmExecute(packagePath, 'run', script);
    }

    private async _npmExecute(packagePath: string, command: NpmCommand, ...args: Array<string>) {
        return new Promise<void>((resolve, reject) => {
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
                    const stdOutStr = stdout.toString();
                    if (stdErrStr) {
                        this._logger.error(stdErrStr);
                    }
                    if (stdOutStr) {
                        this._logger.error(stdOutStr);
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
