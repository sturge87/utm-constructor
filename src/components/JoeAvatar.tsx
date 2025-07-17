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
        left: 24,
        bottom: 24,
        zIndex: 50,
        transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), opacity 0.5s',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.8)',
        opacity: visible ? 1 : 0,
        boxShadow: '0 4px 24px 0 #0008',
        borderRadius: '50%',
        background: '#23272a',
        border: '2px solid #19d89f',
        padding: 4,
        cursor: 'pointer',
      }}
      title="Message Joe on Slack"
    >
      <img
        src="/joe.png"
        alt="Joe"
        width={64}
        height={64}
        style={{ display: 'block', borderRadius: '50%' }}
      />
    </a>
  );
} 