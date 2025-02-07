import React from 'react';
import MashroomLogo from '../../assets/logo-primary.svg';
import styles from './Screenshot.scss';

type Props = {
    srcs: Array<string> | undefined;
    forbidden: boolean;
    showImageInOverlay: (src: string) => void
}

export default ({srcs, forbidden, showImageInOverlay}: Props) => {
    // For the moment just show the first one
    const src = srcs?.[0];

    return (
        <div className={styles.Screenshot}>
            {!src && !forbidden && (
                <div className={styles.NoImage}>
                    <div className={styles.NoImageIcon}
                        dangerouslySetInnerHTML={{ __html: MashroomLogo }}
                    />
                </div>
            )}
            {!src && forbidden && (
                <div className={styles.NotPermitted}>
                    <div className={styles.NotPermittedIcon} />
                </div>
            )}
            {src && (
                <div
                    className={styles.Image}
                    onClick={() => showImageInOverlay(src)}
                    style={{ backgroundImage: `url(${src})` }}
                />
            )}
        </div>
    );
};
