import React from "react";
import '../styles/loading.css';

const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className="loading-overlay">
      <div className="overlay-container">
        <div className="loader">
          <div className="loader-inner">
            {[...Array(5)].map((_, i) => (
              <div className="loader-line-wrap" key={i}>
                <div className="loader-line"></div>
              </div>
            ))}
          </div>
        </div>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Loading;
