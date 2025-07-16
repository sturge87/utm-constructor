"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function buildUtmUrl(fields: typeof initialFields) {
  if (!fields.url || !fields.source || !fields.medium || !fields.campaign) return "";
  let urlStr = fields.url.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = "https://" + urlStr;
  }
  const url = new URL(urlStr);
  url.searchParams.set("utm_source", fields.source);
  url.searchParams.set("utm_medium", fields.medium);
  url.searchParams.set("utm_campaign", fields.campaign);
  if (fields.content) url.searchParams.set("utm_content", fields.content);
  return url.toString();
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

// UTM medium options by source (all sources have the same mediums)
const newMediums = [
  "cpc",
  "paid_social",
  "social",
  "email",
  "referral",
  "display",
  "influencer",
  "retargeting",
  "syndication"
];
const mediumBySource: Record<string, string[]> = Object.fromEntries(
  sourceOptions.map(source => [source, newMediums])
);

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

export default function Home() {
  const [fields, setFields] = useState(initialFields);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedUtms, setSavedUtms] = useState<UTM[]>([]);
  const [loadingUtms, setLoadingUtms] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");

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
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // Compute filtered mediums based on selection
  const filteredMediumOptions = fields.source ? (mediumBySource[fields.source] || []) : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6">UTM URL Generator</h1>
      <div className="w-full max-w-5xl flex flex-col gap-8 md:flex-row md:items-start md:gap-12">
        {/* Generator Form */}
        <div className="flex-1">
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md space-y-4" onSubmit={handleGenerate}>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                Website URL <span className="text-red-500">*</span>
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="url"
                name="url"
                type="url"
                required
                value={fields.url}
                onChange={handleChange}
                placeholder="https://yourwebsite.com/page"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="source">
                Campaign Source (utm_source) <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="campaign">
                Campaign Name (utm_campaign) <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="medium">
                Campaign Medium (utm_medium) <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                Campaign Content (utm_content)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="content"
                name="content"
                type="text"
                value={fields.content}
                onChange={handleChange}
                placeholder="Optional content value"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#19d89f] hover:bg-[#15b87f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
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
        {/* Saved UTMs */}
        <div className="flex-1">
          <div className="w-full max-w-md mt-0 md:mt-6 bg-white rounded shadow px-6 py-6">
            <h2 className="text-lg font-semibold mb-2">Saved UTMs for this URL</h2>
            {/* Filters: only show if there are saved UTMs */}
            {savedUtms.length > 0 && (
              <div className="flex gap-2 mb-2">
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={filterCampaign}
                  onChange={e => setFilterCampaign(e.target.value)}
                >
                  <option value="all">All Campaigns</option>
                  {uniqueCampaigns.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 text-xs"
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
              <div className="text-gray-500">Loading...</div>
            ) : filteredUtms.length === 0 ? (
              <div className="text-gray-500">No UTMs found for this URL.</div>
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
                    <li key={utm.id} className="bg-white border rounded p-2 text-xs flex flex-col gap-1">
                      <span><b>Source:</b> {utm.utm_source} | <b>Medium:</b> {utm.utm_medium} | <b>Campaign:</b> {utm.utm_campaign} {utm.utm_content && <>| <b>Content:</b> {utm.utm_content}</>}</span>
                      <span className="text-gray-400">{new Date(utm.created_at).toLocaleString()}</span>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          className="flex-1 border rounded px-2 py-1 text-xs text-gray-800 bg-gray-100 cursor-text"
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
