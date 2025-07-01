import React, { useState } from "react";

interface FancyTooltipProps {
  text: string; // Tooltip text
  children: React.ReactNode; // Trigger content
}

const FancyTooltip: React.FC<FancyTooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span
        style={{
          cursor: "help",
          display: "inline-block",
          fontWeight: "bold",
        }}
      >
        {children}
      </span>

      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "120%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#333",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            fontSize: "12px",
            zIndex: 1000,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          {text}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              marginLeft: "-5px",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #333",
            }}
          />
        </div>
      )}
    </span>
  );
};

export default FancyTooltip;
