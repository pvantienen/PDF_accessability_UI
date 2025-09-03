import React from 'react';
import './Header.css';
import imgLogo from "../assets/image 20.png";

const Header = ({ processed = 1, total = 3 }) => {
  const progressPercentage = (processed / total) * 100;

  return (
    <div className="header">
      <div className="header-content">
        <div 
          className="logo"
          style={{ backgroundImage: `url('${imgLogo}')` }}
        />
        <div className="progress-bar-section">
          <div className="progress-text">
            Processed: {processed}/{total}
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;