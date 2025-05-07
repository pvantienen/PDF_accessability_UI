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

import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { Bucket,region, } from '../utilities/constants';


function AccessibilityChecker({ originalFileName, updatedFilename, awsCredentials }) {
  const [open, setOpen] = useState(false);

  // Reports in JSON form
  const [beforeReport, setBeforeReport] = useState(null);
  const [afterReport, setAfterReport] = useState(null);

  // Signed URLs for downloading the JSON reports
  const [beforeReportUrl, setBeforeReportUrl] = useState(null);
  const [afterReportUrl, setAfterReportUrl] = useState(null);

  // Loading states for generating pre-signed URLs
  const [isBeforeUrlLoading, setIsBeforeUrlLoading] = useState(false);
  const [isAfterUrlLoading, setIsAfterUrlLoading] = useState(false);

  const [isPolling, setIsPolling] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  const UpdatedFileKeyWithoutExtension = updatedFilename ? updatedFilename.replace(/\.pdf$/i, '') : '';
  const beforeReportKey = `temp/${UpdatedFileKeyWithoutExtension}/accessability-report/${UpdatedFileKeyWithoutExtension}_accessibility_report_before_remidiation.json`;
  const afterReportKey = `temp/${UpdatedFileKeyWithoutExtension}/accessability-report/COMPLIANT_${UpdatedFileKeyWithoutExtension}_accessibility_report_after_remidiation.json`;

  const OriginalFileKeyWithoutExtension = originalFileName ? originalFileName.replace(/\.pdf$/i, '') : '';
  const desiredFilenameBefore = `COMPLIANT_${OriginalFileKeyWithoutExtension}_before_remediation_accessibility_report.json`;
  const desiredFilenameAfter = `COMPLIANT_${OriginalFileKeyWithoutExtension}_after_remediation_accessibility_report.json`;

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: awsCredentials?.accessKeyId,
      secretAccessKey: awsCredentials?.secretAccessKey,
      sessionToken: awsCredentials?.sessionToken,
    },
  });

  /**
   * Utility to fetch the JSON file from S3 (assuming it exists).
   */
  const fetchJsonFromS3 = async (key) => {
    await s3.send(new HeadObjectCommand({ Bucket: Bucket, Key: key }));
    const getObjRes = await s3.send(new GetObjectCommand({ Bucket: Bucket, Key: key }));
    const bodyString = await getObjRes.Body.transformToString();
    return JSON.parse(bodyString);
  };

  /**
 * Generate a presigned URL to directly download the JSON report from S3 with a specified filename.
 * @param {string} key - The S3 object key.
 * @param {string} filename - The desired filename for the downloaded file.
 * @returns {Promise<string>} - The presigned URL.
 */

const generatePresignedUrl = async (key, filename) => {
  const command = new GetObjectCommand({
    Bucket: Bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return await getSignedUrl(s3, command, { expiresIn: 30000 }); // 8.33 hour expiration
};

  /**
   * Fetch the "before" report
   */
  const fetchBeforeReport = async () => {
    try {
      // First fetch the JSON data
      const data = await fetchJsonFromS3(beforeReportKey);
      setBeforeReport(data);
      
      // Then generate a presigned URL for that JSON file
      setIsBeforeUrlLoading(true);
      const presignedUrl = await generatePresignedUrl(beforeReportKey,desiredFilenameBefore);
      setBeforeReportUrl(presignedUrl);
    } catch (error) {
      console.error('Error fetching BEFORE report from S3:', error);
    } finally {
      setIsBeforeUrlLoading(false);
    }
  };

  /**
   * Poll for the "after" report until it is available, then clear the interval
   */
  const fetchAfterReport = async () => {
    try {
      // Fetch the JSON data
      const data = await fetchJsonFromS3(afterReportKey);
      setAfterReport(data);

      // Generate a presigned URL for downloading the AFTER report
      setIsAfterUrlLoading(true);
      const presignedUrl = await generatePresignedUrl(afterReportKey,desiredFilenameAfter);
      setAfterReportUrl(presignedUrl);

      // Stop polling since file now exists
      clearInterval(pollingIntervalId);
      setIsPolling(false);
    } catch (error) {
      console.log('AFTER report not ready. Continuing to poll...', error);
    } finally {
      setIsAfterUrlLoading(false);
    }
  };

  /**
   * Open the dialog, fetch the "before" report, and start polling for the "after" report.
   */
  const handleOpen = () => {
    setOpen(true);
    setIsPolling(true);
    fetchBeforeReport();
    fetchAfterReport();
    const intervalId = setInterval(fetchAfterReport, 15000);
    setPollingIntervalId(intervalId);
  };

  /**
   * Close the dialog, clearing any polling intervals.
   */
  const handleClose = () => {
    setOpen(false);
    clearInterval(pollingIntervalId);
    setIsPolling(false);
  };

  /**
   * Cleanup polling interval on unmount
   */
  useEffect(() => {
    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
  }, [pollingIntervalId]);

  /**
   * Renders a summary table (Before/After) if available
   */
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

  /**
   * Renders the detailed report comparison table
   */
  const renderDetailedReport = () => {
    // If the BEFORE report isn't fetched yet, show a spinner
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
      {updatedFilename && (
        <Button variant="contained" color="primary" onClick={handleOpen} sx={{ marginTop: 2 }}>
          Check PDF Accessibility
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Accessibility Reports (Results By Adobe Accessibility Checker)
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

        <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, padding: '1rem' }}>
          {/* Download BEFORE JSON button */}
          <Button
            variant="outlined"
            color="primary"
            disabled={!beforeReportUrl || isBeforeUrlLoading}
            onClick={() => window.open(beforeReportUrl, '_blank')}
            startIcon={isBeforeUrlLoading && <CircularProgress size={16} />}
          >
            Download Before Report
          </Button>

          {/* Download AFTER JSON button */}
          <Button
            variant="outlined"
            color="primary"
            disabled={!afterReportUrl || isAfterUrlLoading}
            onClick={() => window.open(afterReportUrl, '_blank')}
            startIcon={isAfterUrlLoading && <CircularProgress size={16} />}
          >
            Download After Report
          </Button>

          <Button onClick={handleClose} color="secondary" variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccessibilityChecker;
