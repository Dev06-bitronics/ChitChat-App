import React from 'react';
//@ts-ignore
import styles from './NoDataFound.module.css';

interface NoDataFoundProps {
  message: string;
  imgSrc?: string;
  imgAlt?: string;
  imgSize?: number;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({ message, imgSrc = '/path.png', imgAlt = 'No data found', imgSize = 95 }) => {
  return (
    <div className={styles.noDataFoundContainer}>
      <img src={imgSrc} alt={imgAlt} width={imgSize} height={imgSize} className={styles.noDataFoundImg} />
      <div className={styles.noDataFoundMsg}>{message}</div>
    </div>
  );
};

export default NoDataFound; 