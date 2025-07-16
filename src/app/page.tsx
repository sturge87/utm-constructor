"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function buildUtmUrl(fields: typeof initialFields) {
  if (!fields.url || !fields.source || !fields.medium || !fields.campaign) return "";
  let urlStr = fields.url.trim();
  // Ensure protocol
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = "https://" + urlStr;
  }
  // Remove any trailing ? or #
  urlStr = urlStr.replace(/[?#]+$/, "");
  // Ensure trailing slash before query params
  const urlObj = new URL(urlStr);
  if (!urlObj.pathname.endsWith("/")) {
    urlObj.pathname += "/";
  }
  urlObj.searchParams.set("utm_source", fields.source);
  urlObj.searchParams.set("utm_medium", fields.medium);
  urlObj.searchParams.set("utm_campaign", fields.campaign);
  if (fields.content) urlObj.searchParams.set("utm_content", fields.content);
  return urlObj.toString();
}

const initialFields = {
  url: "",
  source: "",
  medium: "",
  campaign: "",
  content: "",
};

// UTM source options
const sourceOptions = [
  "google",
  "bing",
  "linkedin",
  "facebook",
  "twitter",
  "newsletter",
  "mailchimp",
  "hubspot",
  "g2",
  "gartner",
  "reddit",
  "quora"
];

// Renewed UTM medium options by source
const mediumBySource: Record<string, string[]> = {
  google:     ["cpc", "display", "retargeting", "paid_social", "referral", "syndication"],
  bing:       ["cpc", "display", "retargeting", "referral"],
  linkedin:   ["paid_social", "social", "referral", "influencer", "retargeting"],
  facebook:   ["paid_social", "social", "referral", "influencer", "retargeting"],
  twitter:    ["paid_social", "social", "referral", "influencer", "retargeting"],
  newsletter: ["email", "referral", "syndication"],
  mailchimp:  ["email", "referral", "syndication"],
  hubspot:    ["email", "referral", "syndication"],
  g2:         ["referral", "display", "syndication"],
  gartner:    ["referral", "display", "syndication"],
  reddit:     ["social", "referral", "retargeting"],
  quora:      ["social", "referral", "retargeting"],
};
// All unique mediums for bulk UI
const allMediums = Array.from(new Set(Object.values(mediumBySource).flat()));

// Campaign dropdown options
const campaignOptions = [
  { value: "soqr25", label: "SOQR25" },
  { value: "katalon_ai", label: "Katalon AI" },
  { value: "M2A", label: "Manual to Automated (M2A)" },
  { value: "OS2K", label: "Open source to Katalon (OS2K)" },
  { value: "abm", label: "Signal Based ABM" },
  { value: "competitor_replacement", label: "Competitor Replacement" },
  { value: "brand", label: "Brand" },
];

type UTM = {
  id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string | null;
  created_at: string;
};

type UTMInsert = {
  website_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
};

export default function Home() {
  const [fields, setFields] = useState(initialFields);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedUtms, setSavedUtms] = useState<UTM[]>([]);
  const [loadingUtms, setLoadingUtms] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [urlError, setUrlError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  // Bulk builder state
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkCampaign, setBulkCampaign] = useState('');
  const [bulkSources, setBulkSources] = useState<string[]>([]);
  const [bulkMediums, setBulkMediums] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<string[][]>([]);

  // Helper for all checked sources/mediums
  const toggleBulkSource = (src: string) => setBulkSources(s => s.includes(src) ? s.filter(x => x !== src) : [...s, src]);
  const toggleBulkMedium = (med: string) => setBulkMediums(m => m.includes(med) ? m.filter(x => x !== med) : [...m, med]);

  // Generate all UTM combinations for bulk and save to Supabase
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = bulkUrls.split(/\r?\n/).map(u => u.trim()).filter(Boolean);
    if (!urls.length || !bulkCampaign || !bulkSources.length || !bulkMediums.length) return;
    const combos: string[][] = [];
    const inserts: UTMInsert[] = [];
    urls.forEach(url => {
      bulkSources.forEach(source => {
        bulkMediums.forEach(medium => {
          const utm = buildUtmUrl({ url, source, medium, campaign: bulkCampaign, content: '' });
          combos.push([
            url,
            source,
            medium,
            bulkCampaign,
            utm
          ]);
          inserts.push({
            website_url: url,
            utm_source: source,
            utm_medium: medium,
            utm_campaign: bulkCampaign,
            utm_content: null,
          });
        });
      });
    });
    setBulkResults(combos);
    if (inserts.length) {
      await supabase.from("utms").insert(inserts);
    }
  };

  // Custom URL validation (allow protocol-less domains)
  function isValidUrlOrDomain(str: string) {
    if (!str) return false;
    try {
      // Try with protocol
      new URL(/^https?:\/\//i.test(str) ? str : `https://${str}`);
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (fields.url) {
      setLoadingUtms(true);
      supabase
        .from("utms")
        .select("id, utm_source, utm_medium, utm_campaign, utm_content, created_at")
        .eq("website_url", fields.url)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setSavedUtms(data || []);
          setLoadingUtms(false);
        });
    } else {
      setSavedUtms([]);
    }
  }, [fields.url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
    setGeneratedUrl("");
    setCopied(false);
    if (e.target.name === "url") {
      setUrlError("");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.url || !isValidUrlOrDomain(fields.url)) {
      setUrlError("Please enter a valid URL or domain.");
      return;
    }
    const url = buildUtmUrl(fields);
    setGeneratedUrl(url);
    setCopied(false);
    // Save to Supabase
    if (url) {
      await supabase.from("utms").insert([
        {
          website_url: fields.url,
          utm_source: fields.source,
          utm_medium: fields.medium,
          utm_campaign: fields.campaign,
          utm_content: fields.content || null,
        },
      ]);
      // Refresh saved UTMs
      const { data } = await supabase
        .from("utms")
        .select("id, utm_source, utm_medium, utm_campaign, utm_content, created_at")
        .eq("website_url", fields.url)
        .order("created_at", { ascending: false });
      setSavedUtms(data || []);
    }
  };

  const handleCopy = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleCopySaved = async (utm: UTM) => {
    const url = buildUtmUrl({
      url: fields.url,
      source: utm.utm_source,
      medium: utm.utm_medium,
      campaign: utm.utm_campaign,
      content: utm.utm_content || "",
    });
    await navigator.clipboard.writeText(url);
    setCopiedId(utm.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Compute unique campaigns and sources from savedUtms for filter dropdowns
  const uniqueCampaigns = Array.from(new Set(savedUtms.map(u => u.utm_campaign))).filter(Boolean);
  const uniqueSources = Array.from(new Set(savedUtms.map(u => u.utm_source))).filter(Boolean);

  // Filtered UTMs
  const filteredUtms = savedUtms.filter(utm =>
    (filterCampaign === "all" || utm.utm_campaign === filterCampaign) &&
    (filterSource === "all" || utm.utm_source === filterSource)
  );

  // Compute filtered mediums based on selection (single)
  const filteredMediumOptions = fields.source ? (mediumBySource[fields.source] || []) : [];
  // Compute filtered mediums for bulk: only show mediums valid for at least one selected source
  const filteredBulkMediums = bulkSources.length
    ? Array.from(new Set(bulkSources.flatMap(src => mediumBySource[src] || [])))
    : allMediums;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#313338] p-4 text-[#f2f3f5]">
      <h1 className="text-3xl font-bold mb-6 text-[#f2f3f5]">UTM URL Generator</h1>
      {/* Tabs */}
      <div className="flex mb-6 gap-2">
        <button
          className={`px-4 py-2 rounded-t bg-[#23272a] text-[#f2f3f5] font-semibold border-b-2 ${activeTab === 'single' ? 'border-[#19d89f]' : 'border-transparent'} transition`}
          onClick={() => setActiveTab('single')}
        >Single</button>
        <button
          className={`px-4 py-2 rounded-t bg-[#23272a] text-[#f2f3f5] font-semibold border-b-2 ${activeTab === 'bulk' ? 'border-[#19d89f]' : 'border-transparent'} transition`}
          onClick={() => setActiveTab('bulk')}
        >Bulk</button>
      </div>
      <div className="w-full max-w-5xl flex flex-col gap-8">
        {/* Single Tab */}
        {activeTab === 'single' && (
          <div className="flex-1">
            <form className="bg-[#23272a] shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-5xl flex flex-row flex-wrap gap-4 items-end" onSubmit={handleGenerate}>
              <div className="flex flex-col w-48">
                <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="url">
                  Website URL <span className="text-red-400">*</span>
                </label>
                <input
                  className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  id="url"
                  name="url"
                  type="text"
                  autoComplete="off"
                  value={fields.url}
                  onChange={handleChange}
                  placeholder="yourwebsite.com/page"
                  aria-invalid={!!urlError}
                />
                {urlError && (
                  <span className="text-red-400 text-xs mt-1">{urlError}</span>
                )}
              </div>
              <div className="flex flex-col w-40">
                <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="source">
                  Source <span className="text-red-400">*</span>
                </label>
                <select
                  className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  id="source"
                  name="source"
                  required
                  value={fields.source}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select source</option>
                  {sourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-48">
                <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="campaign">
                  Campaign <span className="text-red-400">*</span>
                </label>
                <select
                  className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  id="campaign"
                  name="campaign"
                  required
                  value={fields.campaign}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select campaign</option>
                  {campaignOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-40">
                <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="medium">
                  Medium <span className="text-red-400">*</span>
                </label>
                <select
                  className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  id="medium"
                  name="medium"
                  required
                  value={fields.medium}
                  onChange={handleChange}
                  disabled={!fields.source}
                >
                  <option value="" disabled>Select medium</option>
                  {filteredMediumOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-48">
                <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="content">
                  Content
                </label>
                <input
                  className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                  id="content"
                  name="content"
                  type="text"
                  value={fields.content}
                  onChange={handleChange}
                  placeholder="Optional content value"
                />
              </div>
              {/* Live UTM Preview (hidden on mobile) */}
              <div className="w-full mb-2 hidden sm:block">
                <span className="block text-[#b5bac1] text-xs font-semibold mb-1">Live UTM Preview:</span>
                <div className="flex flex-row flex-wrap items-center bg-[#383a40] rounded px-3 py-2 text-xs font-mono text-[#f2f3f5]" style={{ gap: '2px' }}>
                  <motion.span
                    key={fields.url || 'empty-url'}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: fields.url ? 1 : 0.95, opacity: fields.url ? 1 : 0.5 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="inline-block"
                  >
                    {fields.url || 'yourwebsite.com/page'}
                  </motion.span>
                  <AnimatePresence>
                    {[fields.source, fields.medium, fields.campaign, fields.content].filter(Boolean).map((val, idx) => {
                      const paramNames = ['?utm_source=', '&utm_medium=', '&utm_campaign=', '&utm_content='];
                      return (
                        <motion.span
                          key={val as string}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut', delay: idx * 0.07 }}
                          className="inline-block"
                          style={{ color: '#19d89f' }}
                        >
                          {paramNames[idx]}{val}
                        </motion.span>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
              <button
                type="submit"
                className="h-10 px-6 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold rounded focus:outline-none focus:ring-2 focus:ring-[#19d89f] transition"
              >
                Generate UTM
              </button>
            </form>
            {generatedUrl && (
              <div className="w-full max-w-md bg-white shadow rounded p-4 flex flex-col items-start mt-2">
                <span className="text-gray-700 text-sm font-semibold mb-2">Generated UTM URL:</span>
                <div className="flex flex-col sm:flex-row w-full gap-2 items-stretch">
                  <input
                    className="flex-1 border rounded px-2 py-1 text-xs text-gray-800 bg-gray-100 cursor-text"
                    value={generatedUrl}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className={`px-3 py-1 rounded bg-[#19d89f] text-white text-xs font-semibold hover:bg-[#15b87f] transition ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={handleCopy}
                    type="button"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Bulk Tab */}
        {activeTab === 'bulk' && (
          <div className="flex flex-col gap-6 bg-[#23272a] rounded shadow px-8 pt-6 pb-8 w-full max-w-3xl mx-auto">
            <form onSubmit={handleBulkGenerate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[#b5bac1] text-xs font-bold mb-1">URLs (one per line)</label>
                <textarea
                  className="w-full min-h-[80px] max-h-40 border border-[#42454a] rounded bg-[#383a40] text-[#f2f3f5] px-3 py-2 text-xs font-mono"
                  value={bulkUrls}
                  onChange={e => setBulkUrls(e.target.value)}
                  placeholder="https://example.com/page1\nhttps://example.com/page2"
                />
              </div>
              <div>
                <label className="block text-[#b5bac1] text-xs font-bold mb-1">Campaign</label>
                <select
                  className="w-full border border-[#42454a] rounded bg-[#383a40] text-[#f2f3f5] px-3 py-2"
                  value={bulkCampaign}
                  onChange={e => setBulkCampaign(e.target.value)}
                >
                  <option value="" disabled>Select campaign</option>
                  {campaignOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-[#b5bac1] text-xs font-bold mb-1">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {sourceOptions.map(src => (
                      <label key={src} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkSources.includes(src)}
                          onChange={() => toggleBulkSource(src)}
                          className="accent-[#19d89f] bg-[#383a40] border-[#42454a]"
                        />
                        <span className="text-xs">{src}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[#b5bac1] text-xs font-bold mb-1">Mediums</div>
                  <div className="flex flex-wrap gap-2">
                    {filteredBulkMediums.map(med => (
                      <label key={med} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkMediums.includes(med)}
                          onChange={() => toggleBulkMedium(med)}
                          className="accent-[#19d89f] bg-[#383a40] border-[#42454a]"
                        />
                        <span className="text-xs">{med}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#19d89f] hover:bg-[#15b87f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-[#19d89f] transition"
              >
                Generate Bulk UTMs
              </button>
            </form>
            {bulkResults.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs bg-[#23272a] border border-[#42454a] rounded">
                  <thead>
                    <tr className="bg-[#383a40]">
                      <th className="p-2 text-left">URL</th>
                      <th className="p-2 text-left">Source</th>
                      <th className="p-2 text-left">Medium</th>
                      <th className="p-2 text-left">Campaign</th>
                      <th className="p-2 text-left">UTM Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResults.map(([url, source, medium, campaign, utm], i) => (
                      <tr key={i} className="border-t border-[#42454a]">
                        <td className="p-2 font-mono text-[#b5bac1]">{url}</td>
                        <td className="p-2">{source}</td>
                        <td className="p-2">{medium}</td>
                        <td className="p-2">{campaign}</td>
                        <td className="p-2 font-mono text-[#19d89f] break-all">{utm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Saved UTMs */}
        <div className="flex-1">
          <div className="w-full max-w-md mt-0 md:mt-6 bg-[#23272a] rounded shadow px-6 py-6 text-[#f2f3f5]">
            <h2 className="text-lg font-semibold mb-2 text-[#f2f3f5]">Saved UTMs for this URL</h2>
            {/* Filters: only show if there are saved UTMs */}
            {savedUtms.length > 0 && (
              <div className="flex gap-2 mb-2">
                <select
                  className="border border-[#42454a] bg-[#383a40] text-[#f2f3f5] rounded px-2 py-1 text-xs"
                  value={filterCampaign}
                  onChange={e => setFilterCampaign(e.target.value)}
                >
                  <option value="all">All Campaigns</option>
                  {uniqueCampaigns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="border border-[#42454a] bg-[#383a40] text-[#f2f3f5] rounded px-2 py-1 text-xs"
                  value={filterSource}
                  onChange={e => setFilterSource(e.target.value)}
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {loadingUtms ? (
              <div className="text-[#b5bac1]">Loading...</div>
            ) : filteredUtms.length === 0 ? (
              <div className="text-[#b5bac1]">No UTMs found for this URL.</div>
            ) : (
              <ul className="space-y-2">
                {filteredUtms.map((utm) => {
                  const url = buildUtmUrl({
                    url: fields.url,
                    source: utm.utm_source,
                    medium: utm.utm_medium,
                    campaign: utm.utm_campaign,
                    content: utm.utm_content || "",
                  });
                  return (
                    <li key={utm.id} className="bg-[#383a40] border border-[#42454a] rounded p-2 text-xs flex flex-col gap-1 text-[#f2f3f5]">
                      <span><b>Source:</b> {utm.utm_source} | <b>Medium:</b> {utm.utm_medium} | <b>Campaign:</b> {utm.utm_campaign} {utm.utm_content && <>| <b>Content:</b> {utm.utm_content}</>}</span>
                      <span className="text-[#b5bac1]">{new Date(utm.created_at).toLocaleString()}</span>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          className="flex-1 border border-[#42454a] rounded px-2 py-1 text-xs text-[#f2f3f5] bg-[#23272a] cursor-text"
                          value={url}
                          readOnly
                          onFocus={e => e.target.select()}
                        />
                        <button
                          className={`px-2 py-1 rounded bg-[#19d89f] text-white text-xs font-semibold hover:bg-[#15b87f] transition ${copiedId === utm.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          onClick={() => handleCopySaved(utm)}
                          type="button"
                        >
                          {copiedId === utm.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
