"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function buildUtmUrl(fields: typeof initialFields) {
  if (!fields.url || !fields.source || !fields.medium || !fields.campaign) return "";
  const url = new URL(fields.url);
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

const sourceOptions = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter" },
  { value: "tiktok", label: "TikTok" },
  { value: "bing", label: "Bing" },
  { value: "newsletter", label: "Newsletter" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "snapchat", label: "Snapchat" },
  { value: "reddit", label: "Reddit" },
  { value: "quora", label: "Quora" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "affiliate", label: "Affiliate" },
  { value: "partner", label: "Partner" },
  { value: "referral", label: "Referral" },
  { value: "display", label: "Display Network" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const mediumOptions = [
  { value: "cpc", label: "CPC (Paid Search)" },
  { value: "ppc", label: "PPC" },
  { value: "cpm", label: "CPM" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
  { value: "organic", label: "Organic" },
  { value: "referral", label: "Referral" },
  { value: "display", label: "Display" },
  { value: "banner", label: "Banner" },
  { value: "video", label: "Video" },
  { value: "native", label: "Native" },
  { value: "push", label: "Push Notification" },
  { value: "sms", label: "SMS" },
  { value: "influencer", label: "Influencer" },
  { value: "affiliate", label: "Affiliate" },
  { value: "print", label: "Print" },
  { value: "podcast", label: "Podcast" },
  { value: "event", label: "Event" },
  { value: "app", label: "App" },
  { value: "qr", label: "QR Code" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
];

const contentOptions = [
  { value: "banner_ad", label: "Banner Ad" },
  { value: "text_link", label: "Text Link" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" },
  { value: "header", label: "Header" },
  { value: "cta_button", label: "CTA Button" },
  { value: "carousel", label: "Carousel" },
  { value: "video_ad", label: "Video Ad" },
  { value: "sponsored_post", label: "Sponsored Post" },
  { value: "native_ad", label: "Native Ad" },
  { value: "popup", label: "Popup" },
  { value: "interstitial", label: "Interstitial" },
  { value: "newsletter_top", label: "Newsletter Top" },
  { value: "newsletter_bottom", label: "Newsletter Bottom" },
  { value: "newsletter_sidebar", label: "Newsletter Sidebar" },
  { value: "product_tile", label: "Product Tile" },
  { value: "feature_box", label: "Feature Box" },
  { value: "promo_code", label: "Promo Code" },
  { value: "app_banner", label: "App Banner" },
  { value: "story", label: "Story" },
  { value: "feed", label: "Feed" },
  { value: "search_ad", label: "Search Ad" },
  { value: "display_ad", label: "Display Ad" },
  { value: "remarketing", label: "Remarketing" },
  { value: "retargeting", label: "Retargeting" },
  { value: "lead_form", label: "Lead Form" },
  { value: "survey", label: "Survey" },
  { value: "quiz", label: "Quiz" },
  { value: "giveaway", label: "Giveaway" },
  { value: "contest", label: "Contest" },
  { value: "other", label: "Other" },
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6">UTM URL Generator</h1>
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
          >
            <option value="" disabled>Select medium</option>
            {mediumOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="campaign">
            Campaign Name (utm_campaign) <span className="text-red-500">*</span>
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="campaign"
            name="campaign"
            type="text"
            required
            value={fields.campaign}
            onChange={handleChange}
            placeholder="e.g. spring_sale"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
            Campaign Content (utm_content)
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="content"
            name="content"
            value={fields.content}
            onChange={handleChange}
          >
            <option value="" disabled>Select content</option>
            {contentOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
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
              className={`px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={handleCopy}
              type="button"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">Saved UTMs for this URL</h2>
        {loadingUtms ? (
          <div className="text-gray-500">Loading...</div>
        ) : savedUtms.length === 0 ? (
          <div className="text-gray-500">No UTMs found for this URL.</div>
        ) : (
          <ul className="space-y-2">
            {savedUtms.map((utm) => (
              <li key={utm.id} className="bg-white border rounded p-2 text-xs flex flex-col">
                <span><b>Source:</b> {utm.utm_source} | <b>Medium:</b> {utm.utm_medium} | <b>Campaign:</b> {utm.utm_campaign} {utm.utm_content && <>| <b>Content:</b> {utm.utm_content}</>}</span>
                <span className="text-gray-400">{new Date(utm.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
