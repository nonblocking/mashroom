
import UAParser from 'ua-parser-js';
import type {IncomingMessage} from 'http';

export type UserAgent = {
    readonly browser: {
        readonly name: 'Android Browser' | 'Chrome' | 'Chromium' | 'Edge' | 'Firefox' | 'IE' | 'IEMobile' | 'Konqueror' | 'Mobile Safari' | 'Opera Mini' | 'Opera' | 'Safari' | 'Samsung Browser' | 'Tizen Browser' | string | undefined;
        readonly version: string | undefined;
        readonly major: string | undefined;
    };
    readonly os: {
        readonly name: 'AIX' | 'Amiga OS' | 'Android' | 'Arch' | 'Bada' |  'BeOS' | 'BlackBerry' | 'CentOS' | 'Chromium OS' | 'Contiki' | 'Fedora' | 'Firefox OS' | 'FreeBSD' | 'Debian' | 'DragonFly' | 'Gentoo' | 'GNU' | 'Haiku' | 'Hurd' | 'iOS' | 'Joli' | 'Linpus' | 'Linux' | 'Mac OS' | 'Mageia' | 'Mandriva' | 'MeeGo' | 'Minix' | 'Mint' | 'Morph OS' | 'NetBSD' | 'Nintendo' | 'OpenBSD' | 'OpenVMS' | 'OS/2' | 'Palm' | 'PCLinuxOS' | 'Plan9' | 'Playstation' | 'QNX' | 'RedHat' | 'RIM Tablet OS' | 'RISC OS' | 'Sailfish' | 'Series40' | 'Slackware' | 'Solaris' | 'SUSE' | 'Symbian' | 'Tizen' | 'Ubuntu' | 'UNIX' | 'VectorLinux' | 'WebOS' | 'Zenwalk' | string | undefined;
        readonly version: string | undefined;
    };
}

export const determineUserAgent = (req: IncomingMessage): UserAgent => {
    const {browser, os} = UAParser(req.headers['user-agent']);

    return {
        browser: {
            name: browser.name,
            version: browser.version,
            major: browser.major,
        },
        os: {
            name: os.name,
            version: os.version,
        }
    };
};
