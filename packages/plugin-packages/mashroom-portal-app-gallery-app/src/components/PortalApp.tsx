import React from 'react';
import styles from './PortalApp.scss';
import Screenshot from './Screenshot';
import HighlightFilterQuery from './HighlightFilterQuery';
import type {MashroomKnownPortalApp} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    app: MashroomKnownPortalApp;
    sandboxPath: string | null;
    searchFilter: string | undefined;
    showImageInOverlay: (src: string) => void;
    messages: {
        category: string;
        tags: string;
        homepage: string;
        permissions: string;
        availableToEveryone: string;
        roleRequired: string;
        noScreenshot: string;
        notPermitted: string;
        tryOut: string;
    }
};

export default ({app, sandboxPath, searchFilter, showImageInOverlay, messages}: Props) => {
    const {name, title, category, requiredRoles} = app;
    let description, screenshots, homepage, tags;
    if (app.available) {
        description = app.description;
        screenshots = app.screenshots;
        homepage = app.homepage;
        tags = app.tags;
    }

    return (
        <div className={`${styles.PortalApp} ${!app.available ? styles.NotPermitted : ''}`}>
            <div className={styles.Wrapper}>
                <div className={styles.Title}>
                    <HighlightFilterQuery searchFilter={searchFilter} text={title ?? name} />
                </div>
                <Screenshot
                    srcs={screenshots}
                    forbidden={!app.available}
                    showImageInOverlay={showImageInOverlay}
                />
                <div className={styles.Description}>
                    <HighlightFilterQuery searchFilter={searchFilter} text={description ?? ' '} />
                </div>
                <div className={styles.Details}>
                    <div className={styles.Detail}>
                        <div className={styles.DetailLabel}>
                            {messages.category}
                        </div>
                        <div className={styles.DetailValue}>
                            {category ?? '-'}
                        </div>
                    </div>
                    <div className={styles.Detail}>
                        <div className={styles.DetailLabel}>
                            {messages.tags}
                        </div>
                        <div className={styles.DetailValue}>
                            <HighlightFilterQuery searchFilter={searchFilter} text={tags?.map((t) => `#${t}`).join(' ') ?? '-'} />
                        </div>
                    </div>
                    <div className={styles.Detail}>
                        <div className={styles.DetailLabel}>
                            {messages.homepage}
                        </div>
                        <div className={styles.DetailValue}>
                            {homepage && <a href={homepage} target='_blank' rel="noreferrer">{homepage}</a>}
                            {!homepage && '-'}
                        </div>
                    </div>
                    <div className={styles.Detail}>
                        <div className={styles.DetailLabel}>
                            {messages.permissions}
                        </div>
                        <div className={styles.DetailValue}>
                            {requiredRoles.length === 0 && (
                                <span>{messages.availableToEveryone}</span>
                            )}
                            {requiredRoles.length > 0 && (
                                <span>{messages.roleRequired}: <span className={styles.RequiredRoles}>{requiredRoles.join(', ')}</span></span>
                            )}
                        </div>
                    </div>
                    {sandboxPath && (
                        <div className={styles.Detail}>
                            <div className={styles.DetailLabel}>
                                {messages.tryOut}
                            </div>
                            <div className={styles.DetailValue}>
                                {app.available && (
                                    <a href={`${sandboxPath}?sbPreselectAppName=${encodeURIComponent(name)}`} target='_blank' rel='noreferrer'>Sandbox</a>
                                )}
                                {!app.available && '-'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
