// src/components/AccessibilityChecker.js
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const region = process.env.REACT_APP_BUCKET_REGION;
const bucketName = process.env.REACT_APP_BUCKET_NAME;

function AccessibilityChecker({ filename, awsCredentials }) {
  const [open, setOpen] = useState(false);
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  const fileKeyWithoutExtension = filename ? filename.replace(/\.pdf$/i, '') : '';
  const beforeReportKey = `temp/${fileKeyWithoutExtension}/accessability-report/${fileKeyWithoutExtension}_accessibility_report_before_remidiation.json`;
  const afterReportKey = `temp/${fileKeyWithoutExtension}/accessability-report/COMPLIANT_${fileKeyWithoutExtension}_accessibility_report_after_remidiation.json`;

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: awsCredentials?.accessKeyId,
      secretAccessKey: awsCredentials?.secretAccessKey,
      sessionToken: awsCredentials?.sessionToken,
    },
  });

  const fetchJsonFromS3 = async (key) => {
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    const getObjRes = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    const bodyString = await getObjRes.Body.transformToString();
    return JSON.parse(bodyString);
  };

  const handleOpen = () => {
    setOpen(true);
    setIsPolling(true);
    fetchBeforeReport();
    const intervalId = setInterval(fetchAfterReport, 15000);
    setPollingIntervalId(intervalId);
  };

  const handleClose = () => {
    setOpen(false);
    clearInterval(pollingIntervalId);
    setIsPolling(false);
  };

  const fetchBeforeReport = async () => {
    try {
      const data = await fetchJsonFromS3(beforeReportKey);
      setBeforeReport(data);
    } catch (error) {
      console.error('Error fetching BEFORE report from S3:', error);
    }
  };

  const fetchAfterReport = async () => {
    try {
      const data = await fetchJsonFromS3(afterReportKey);
      setAfterReport(data);
      clearInterval(pollingIntervalId);
      setIsPolling(false);
    } catch (error) {
      console.log('AFTER report not ready. Continuing to poll...', error);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
  }, [pollingIntervalId]);

  const renderSummary = (report, label) => {
    if (!report) return null;
    const { Summary } = report;
    if (!Summary) return null;

    return (
      <Box sx={{ margin: '1rem 0', flex: 1 }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          {`${label} Summary`}
        </Typography>
        <Table size="small" sx={{ border: '1px solid #ddd', borderRadius: 2 }}>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Needs Manual Check</TableCell>
              <TableCell>Passed</TableCell>
              <TableCell>Failed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{Summary.Description}</TableCell>
              <TableCell>
                <Chip label={Summary['Needs manual check']} color="warning" />
              </TableCell>
              <TableCell>
                <Chip label={Summary.Passed} color="success" />
              </TableCell>
              <TableCell>
                <Chip label={Summary.Failed} color="error" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    );
  };

  const renderDetailedReport = () => {
    if (!beforeReport) return <CircularProgress />;

    const categories = Object.keys(beforeReport['Detailed Report'] || {});

    return categories.map((category) => {
      const beforeItems = beforeReport['Detailed Report'][category] || [];
      const afterItems = afterReport?.['Detailed Report']?.[category] || [];
      const allRules = new Set([
        ...beforeItems.map((item) => item.Rule),
        ...afterItems.map((item) => item.Rule),
      ]);
      const afterMap = afterItems.reduce((acc, item) => {
        acc[item.Rule] = item;
        return acc;
      }, {});

      return (
        <Accordion key={category} sx={{ border: '1px solid #ddd', margin: '0.5rem 0' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#e3f2fd' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {category}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small" sx={{ border: '1px solid #ddd' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Rule</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status (Before)</TableCell>
                  <TableCell>Status (After)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(allRules).map((rule) => {
                  const beforeItem = beforeItems.find((i) => i.Rule === rule);
                  const afterItem = afterMap[rule];

                  return (
                    <TableRow key={rule}>
                      <TableCell>{rule}</TableCell>
                      <TableCell>
                        {afterItem ? afterItem.Description : beforeItem?.Description}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={beforeItem?.Status || '—'}
                          color={
                            beforeItem?.Status === 'Passed'
                              ? 'success'
                              : beforeItem?.Status === 'Failed'
                              ? 'error'
                              : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={afterItem?.Status || '—'}
                          color={
                            afterItem?.Status === 'Passed'
                              ? 'success'
                              : afterItem?.Status === 'Failed'
                              ? 'error'
                              : 'warning'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      );
    });
  };

  return (
    <>
      {filename && (
        <Button variant="contained" color="primary" onClick={handleOpen} sx={{ marginTop: 2 }}>
          Check PDF Accessibility
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Accessibility Reports (Powered By Adobe Accessibility Checker)
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {renderSummary(beforeReport, 'Before')}
            {renderSummary(afterReport, 'After')}
          </Box>

          <Typography variant="h5" sx={{ marginTop: '2rem', color: '#1565c0', fontWeight: 'bold' }}>
            Detailed Report
          </Typography>
          {isPolling && !afterReport && (
            <Typography variant="body2" color="textSecondary">
              Generating remediated PDF report (updating every 15s)...
            </Typography>
          )}

          <Box sx={{ marginTop: '1rem' }}>{renderDetailedReport()}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccessibilityChecker;
