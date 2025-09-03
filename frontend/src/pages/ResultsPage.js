import React from 'react';
import ResultsContainer from '../components/ResultsContainer';

const ResultsPage = ({ fileName, processedResult, format }) => {
  return <ResultsContainer fileName={fileName} processedResult={processedResult} format={format} />;
};

export default ResultsPage;