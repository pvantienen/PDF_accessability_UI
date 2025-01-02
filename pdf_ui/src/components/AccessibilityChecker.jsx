// src/components/AccessibilityChecker.js
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// 1) Import AWS S3-related dependencies
import { S3Client, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// If using environment variables for region & bucket:
const region = process.env.REACT_APP_BUCKET_REGION;
const bucketName = process.env.REACT_APP_BUCKET_NAME;

/**
 * AccessibilityChecker:
 * - Polls S3 for before/after JSON accessibility reports
 * - Displays them in a Dialog with summary and detailed results
 */
function AccessibilityChecker({ filename, awsCredentials }) {
  const [open, setOpen] = useState(false);
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  // Build the S3 paths
  // BEFORE: temp/{fileKeyWithoutExtension}/accessability-report/{fileKeyWithoutExtension}_accessibility_report_before_remidiation.json
  // AFTER:  temp/{fileKeyWithoutExtension}/accessability-report/COMPLIANT_{fileKeyWithoutExtension}_accessibility_report_after_remidiation.json
  const fileKeyWithoutExtension = filename
    ? filename.replace(/\.pdf$/i, '')
    : '';
   
  const beforeReportKey = `temp/${fileKeyWithoutExtension}/accessability-report/${fileKeyWithoutExtension}_accessibility_report_before_remidiation.json`;
  const afterReportKey = `temp/${fileKeyWithoutExtension}/accessability-report/COMPLIANT_${fileKeyWithoutExtension}_accessibility_report_after_remidiation.json`;

  // Create an S3 client instance once (could also do this inside each fetch function)
  const s3 = new S3Client({
            region,
            credentials: {
              accessKeyId: awsCredentials?.accessKeyId,
              secretAccessKey: awsCredentials?.secretAccessKey,
              sessionToken: awsCredentials?.sessionToken,
            },
          });

  // ---- Helper to fetch JSON from S3 ----
  const fetchJsonFromS3 = async (key) => {
    // Check if object exists via HeadObject
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    // Download the JSON
    const getObjRes = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    // Convert stream to string, then parse
    // transformToString is available in the AWS SDK for JS v3
    const bodyString = await getObjRes.Body.transformToString();
    return JSON.parse(bodyString);
  };

  // ---- OPEN DIALOG & START POLLING ----
  const handleOpen = () => {
    setOpen(true);
    setIsPolling(true);

    // 1) Immediately try to fetch BEFORE report
    fetchBeforeReport();

    // 2) Start polling for AFTER report every 15s
    const intervalId = setInterval(() => {
      fetchAfterReport();
    }, 15000);
    setPollingIntervalId(intervalId);
  };

  // ---- CLOSE DIALOG & CLEAN UP ----
  const handleClose = () => {
    setOpen(false);
    clearInterval(pollingIntervalId);
    setIsPolling(false);
  };

  // ---- FETCH BEFORE REPORT FROM S3 ----
  const fetchBeforeReport = async () => {
    try {
      // Attempt to fetch the "before" JSON from S3
      const data = await fetchJsonFromS3(beforeReportKey);
      setBeforeReport(data);
    } catch (error) {
      console.error('Error fetching BEFORE report from S3:', error);
    }
  };

  // ---- FETCH AFTER REPORT FROM S3 ----
  const fetchAfterReport = async () => {
    try {
      // Attempt to fetch the "after" JSON from S3
      const data = await fetchJsonFromS3(afterReportKey);
      setAfterReport(data);

      // Stop polling once AFTER report is available
      clearInterval(pollingIntervalId);
      setIsPolling(false);
    } catch (error) {
      // It's fine if AFTER is not ready yet, keep polling
      console.log('AFTER report not ready. Continuing to poll...', error);
    }
  };

  // ---- CLEAN UP INTERVAL ON UNMOUNT ----
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  // ---- RENDER THE SUMMARY TABLE ----
  const renderSummary = (report, label) => {
    if (!report) return null;
    const { Summary } = report;
    if (!Summary) return null;

    return (
      <Box sx={{ margin: '1rem 0' }}>
        <Typography variant="h6">{`${label} Summary`}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Needs manual check</TableCell>
              <TableCell>Passed</TableCell>
              <TableCell>Failed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{Summary.Description}</TableCell>
              <TableCell>{Summary['Needs manual check']}</TableCell>
              <TableCell>{Summary.Passed}</TableCell>
              <TableCell>{Summary.Failed}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    );
  };

  // ---- RENDER THE DETAILED REPORT (ACCORDION) ----
  const renderDetailedReport = () => {
    // If we don’t have BEFORE data, display a spinner
    if (!beforeReport) {
      return <CircularProgress />;
    }

    // AFTER might still be null
    const categories = Object.keys(beforeReport['Detailed Report'] || {});

    return categories.map((category) => {
      const beforeItems = beforeReport['Detailed Report'][category] || [];
      const afterItems = afterReport?.['Detailed Report']?.[category] || [];

      // Collect all rule names
      const allRules = new Set([
        ...beforeItems.map((item) => item.Rule),
        ...afterItems.map((item) => item.Rule),
      ]);

      // Map AFTER items by rule
      const afterMap = afterItems.reduce((acc, item) => {
        acc[item.Rule] = item;
        return acc;
      }, {});

      return (
        <Accordion key={category}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{category}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Table size="small">
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
                        {afterItem
                          ? afterItem.Description
                          : beforeItem?.Description}
                      </TableCell>
                      <TableCell>{beforeItem?.Status || '—'}</TableCell>
                      <TableCell>{afterItem?.Status || '—'}</TableCell>
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
      {/* Only show this button if a filename exists */}
      {filename && (
        <Button 
          variant="outlined" 
          color="info" 
          onClick={handleOpen}
          sx={{ marginTop: 2 }}
        >
          Check PDF Accessibility
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>Accessibility Reports</DialogTitle>
        <DialogContent dividers>
          {/* Summaries side by side */}
          <Box sx={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {renderSummary(beforeReport, 'Before')}
            {renderSummary(afterReport, 'After')}
          </Box>

          <Typography variant="h5" sx={{ marginTop: '2rem' }}>
            Detailed Report
          </Typography>
          {isPolling && !afterReport && (
            <Typography variant="body2" color="textSecondary">
              Polling for AFTER report... (every 15s)
            </Typography>
          )}

          {/* Category-specific details */}
          <Box sx={{ marginTop: '1rem' }}>{renderDetailedReport()}</Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AccessibilityChecker;
