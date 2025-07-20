"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function JoeAvatar() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 200); // slight delay for effect
  }, []);

  // Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    const { error } = await supabase.from("suggestions").insert([
      { name, email, suggestion }
    ]);
    setSubmitting(false);
    if (error) {
      setError("Something went wrong. Please try again.");
    } else {
      setSuccess(true);
      setName("");
      setEmail("");
      setSuggestion("");
      setTimeout(() => setModalOpen(false), 1200);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          zIndex: 50,
          transition: 'transform 0.5s cubic-bezier(.4,2,.3,1), opacity 0.5s',
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          opacity: visible ? 1 : 0,
          maxWidth: hovered ? 280 : 140,
          width: '100%',
          padding: 0,
          margin: 0,
          background: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: 0,
          cursor: 'pointer',
        }}
        title="Send a suggestion to Joe"
      >
        <img
          src={hovered ? "/joe.png" : "/joe-idle.png"}
          alt="Joe"
          width={hovered ? 280 : 140}
          height={hovered ? 280 : 140}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: hovered ? 280 : 140,
            borderRadius: 0,
            margin: 0,
            padding: 0,
            background: 'none',
            boxShadow: 'none',
            border: 'none',
            transition: 'max-width 0.4s cubic-bezier(.4,2,.3,1), width 0.4s cubic-bezier(.4,2,.3,1), height 0.4s cubic-bezier(.4,2,.3,1)',
          }}
        />
      </button>
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#23272a',
            borderRadius: 16,
            padding: 32,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            color: '#f2f3f5',
            position: 'relative',
          }}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#b5bac1', fontSize: 20, cursor: 'pointer' }}>&times;</button>
            <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Send a suggestion</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{ background: '#383a40', color: '#f2f3f5', border: '1px solid #42454a', borderRadius: 8, padding: '8px 12px', fontSize: 15 }}
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ background: '#383a40', color: '#f2f3f5', border: '1px solid #42454a', borderRadius: 8, padding: '8px 12px', fontSize: 15 }}
              />
              <textarea
                placeholder="Your suggestion"
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
                required
                rows={4}
                style={{ background: '#383a40', color: '#f2f3f5', border: '1px solid #42454a', borderRadius: 8, padding: '8px 12px', fontSize: 15 }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{ background: '#19d89f', color: '#23272a', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 16, marginTop: 8, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Sending...' : 'Send Suggestion'}
              </button>
              {success && <div style={{ color: '#19d89f', marginTop: 8 }}>Thank you for your suggestion!</div>}
              {error && <div style={{ color: '#ff4d4f', marginTop: 8 }}>{error}</div>}
            </form>
          </div>
        </div>
      )}
    </>
  );
} 