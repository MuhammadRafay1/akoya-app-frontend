// src/components/Header.tsx
import React from "react";

type HeaderProps = {
  onGetAuthClick: () => void;
  logoSrc?: string;
  title?: string;
  height?: number;
};

export default function Header({
  onGetAuthClick,
  logoSrc = "/static/images/logo.png",
  title = "Akoya API",
  height = 64,
}: HeaderProps) {
  const barStyle: React.CSSProperties = {
    backgroundColor: "#212121",
    color: "white",
    height,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "3px solid #002831", // orange/gold bottom line
    boxSizing: "border-box",
  };

  const leftStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const logoBoxStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: 220,
    height: height - 20,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: "white",
  };

  const buttonStyle: React.CSSProperties = {
    background: "#0095b7ff",
    color: "#000",
    padding: "10px 18px",
    borderRadius: 6,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 1px 0 rgba(0,0,0,0.2)",
  };

  return (
    <header style={barStyle}>
      <div style={leftStyle}>
        <div style={logoBoxStyle}>
          <img
            src={logoSrc}
            alt="Logo"
            style={{ height: "100%", objectFit: "contain" }}
          />
        </div>

        <div>
          <div style={titleStyle}>{title}</div>
        </div>
      </div>

      <div>
        <button style={buttonStyle} onClick={onGetAuthClick}>
          GET AUTH TOKEN
        </button>
      </div>
    </header>
  );
}
