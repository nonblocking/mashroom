
import {existsSync} from 'fs';
import {resolve, sep} from 'path';
import {exec, execSync} from 'child_process';
import type {MashroomLogger, MashroomLoggerFactory} from '../../../type-definitions';

const DEFAULT_NX_EXECUTION_TIMEOUT_SEC = 3 * 60; // 3min

/*
 * nx execution utils
 */
export default class NxUtils {

    private readonly _logger: MashroomLogger;
    private readonly _nxExecutableCache: Record<string, string | null>;
    private readonly _nxWorkingExecutables: Array<string>;

    constructor(loggerFactory: MashroomLoggerFactory, private _npmExecutionTimeoutSec = DEFAULT_NX_EXECUTION_TIMEOUT_SEC) {
        this._logger = loggerFactory('mashroom.plugins.build');
        this._nxExecutableCache = {};
        this._nxWorkingExecutables = [];
    }

    async isNxAvailable(packagePath: string): Promise<boolean> {
        if (packagePath in this._nxExecutableCache) {
            return !!this._nxExecutableCache[packagePath];
        }

        let nxConfigFound = false;
        let searchPath = packagePath;
        for (let i = /* max depth */ 5; i >= 0; i--) {
            if (existsSync(resolve(searchPath, 'nx.json'))) {
                nxConfigFound = true;
                break;
            }
            searchPath = resolve(searchPath, '..');
        }
        if (!nxConfigFound) {
            return false;
        }

        // Check if nx is executable
        try {
            const workspaceLocalExecutable = `${searchPath}${sep}node_modules${sep}.bin${sep}nx`;
            if (!this._nxWorkingExecutables.find((e) => workspaceLocalExecutable === e)) {
                execSync(`${workspaceLocalExecutable} --version`, {
                    stdio: 'ignore',
                });
                this._nxWorkingExecutables.push(workspaceLocalExecutable);
            }
            this._nxExecutableCache[packagePath] = workspaceLocalExecutable;
            return true;
        } catch (e) {
            try {
                const globalExecutable = 'nx';
                if (!this._nxWorkingExecutables.find((e) => globalExecutable === e)) {
                    execSync(`${globalExecutable} --version`, {
                        stdio: 'ignore',
                    });
                    this._nxWorkingExecutables.push(globalExecutable);
                }
                this._nxExecutableCache[packagePath] = globalExecutable;
                return true;
            } catch (e) {
                this._logger.info('nx.json found but no executable, falling back to npm');
            }
        }

        this._nxExecutableCache[packagePath] = null;
        return false;
    }

    /*
     * Run a npm script in given package path
     */
    async runScript(packagePath: string, script: string) {
        if (!await this.isNxAvailable(packagePath)) {
            throw new Error('nx not available!');
        }
        const nxExecutable = this._nxExecutableCache[packagePath];
        return new Promise<void>((resolve, reject) => {
            const commandString = `${nxExecutable} ${script}`;

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
