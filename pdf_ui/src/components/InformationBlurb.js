import React from 'react';
import './InformationBlurb.css';
import imgDollar from "../assets/circle-dollar-sign.svg";
import imgCheckmark from "../assets/circle-check-big.svg";
import imgZap from "../assets/zap.svg";

const InformationBlurb = () => {
  const features = [
    {
      icon: imgDollar,
      title: "Cost Effective Options",
      description: "Reduce costs to less than a penny per page"
    },
    {
      icon: imgCheckmark,
      title: "WCAG 2.1 Level AA Standard",
      description: "Meets international accessibility standards"
    },
    {
      icon: imgZap,
      title: "Fast Processing",
      description: "Get automated PDF remediation in minutes"
    }
  ];

  return (
    <div className="information-blurb">
      {features.map((feature, index) => (
        <div key={index} className="feature-card">
          <div className="icon-container">
            <img src={feature.icon} alt="" className="icon" />
          </div>
          <div className="feature-content">
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InformationBlurb;