import React from 'react';
import './ReportModal.css';
import imgVector from "../assets/chevron-up.svg";
import img1 from "../assets/chevron-down.svg";
import img from "../assets/x.svg";

const ReportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>PDF Accessibility Report</h2>
          <div className="header-actions">
            <button className="download-report-btn">Download Report</button>
            <button className="close-btn" onClick={onClose}>
              <img alt="" src={img} />
            </button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="report-summary">
            <div className="summary-section">
              <h3>Before Remediation</h3>
              <div className="summary-stats">
                <div className="stat-column">
                  <div className="stat-title">Needs Manual Check</div>
                  <div className="stat-badge orange">2</div>
                </div>
                <div className="stat-column">
                  <div className="stat-title">Passed</div>
                  <div className="stat-badge green">14</div>
                </div>
                <div className="stat-column">
                  <div className="stat-title">Failed</div>
                  <div className="stat-badge red">16</div>
                </div>
              </div>
            </div>
            
            <div className="summary-section">
              <h3>After Remediation</h3>
              <div className="summary-stats">
                <div className="stat-column">
                  <div className="stat-title">Needs Manual Check</div>
                  <div className="stat-badge orange">2</div>
                </div>
                <div className="stat-column">
                  <div className="stat-title">Passed</div>
                  <div className="stat-badge green">28</div>
                </div>
                <div className="stat-column">
                  <div className="stat-title">Failed</div>
                  <div className="stat-badge red">2</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="detailed-report">
            <h3>Detailed Report</h3>
            
            <div className="report-section expanded">
              <div className="section-header">
                <span>Document</span>
                <img alt="" src={imgVector} />
              </div>
              <div className="section-content">
                <div className="table-header">
                  <span>Rule</span>
                  <span>Description</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                
                <div className="table-row">
                  <span>Accessibility permission flag</span>
                  <span>Accessibility permission flag must be set</span>
                  <div className="status-badge green">Passed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Image-only PDF</span>
                  <span>Document is not image-only PDF</span>
                  <div className="status-badge green">Passed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Tagged PDF</span>
                  <span>Document is tagged PDF</span>
                  <div className="status-badge red">Failed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Logical Reading Order</span>
                  <span>Document structure provides a logical reading order</span>
                  <div className="status-badge orange">Needs Manual Check</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Primary language</span>
                  <span>Text language is specified</span>
                  <div className="status-badge red">Failed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Title</span>
                  <span>Document title is showing in title bar</span>
                  <div className="status-badge green">Passed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Bookmarks</span>
                  <span></span>
                  <div className="status-badge green">Passed</div>
                  <div className="status-badge green">Passed</div>
                </div>
                
                <div className="table-row">
                  <span>Color contrast</span>
                  <span>Document has appropriate color contrast</span>
                  <div className="status-badge orange">Needs Manual Check</div>
                  <div className="status-badge orange">Needs Manual Check</div>
                </div>
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Page Content</span>
                <img alt="" src={img1} />
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Forms</span>
                <img alt="" src={img1} />
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Alternate Text</span>
                <img alt="" src={img1} />
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Tables</span>
                <img alt="" src={img1} />
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Lists</span>
                <img alt="" src={img1} />
              </div>
            </div>
            
            <div className="report-section">
              <div className="section-header">
                <span>Headings</span>
                <img alt="" src={img1} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;