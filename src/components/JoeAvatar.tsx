"use client";
import { useEffect, useState } from "react";

export default function JoeAvatar() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 200); // slight delay for effect
  }, []);
  return (
    <a
      href="https://slack.com/app_redirect?channel=U07PN5PEXH8"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 50,
        transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), opacity 0.5s',
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        opacity: visible ? 1 : 0,
        maxWidth: 280,
        width: '100%',
        padding: 0,
        margin: 0,
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 0,
        cursor: 'pointer',
      }}
      title="Message Joe on Slack"
    >
      <img
        src="/joe.png"
        alt="Joe"
        width={280}
        height={280}
        style={{ display: 'block', width: '100%', maxWidth: 280, borderRadius: 0, margin: 0, padding: 0, background: 'none', boxShadow: 'none', border: 'none' }}
      />
    </a>
  );
} 