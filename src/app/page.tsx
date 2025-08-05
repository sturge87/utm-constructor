"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import JoeAvatar from "../components/JoeAvatar";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function buildUtmUrl(fields: typeof initialFields) {
  console.log("buildUtmUrl called with fields:", fields);
  
  if (!fields.url || !fields.source || !fields.medium) {
    console.log("Missing required fields:", { url: fields.url, source: fields.source, medium: fields.medium });
    return "";
  }
  
  // Only require campaign if not meta_abo or meta_cbo
  if ((fields.source !== "meta_abo" && fields.source !== "meta_cbo") && !fields.campaign) {
    console.log("Campaign required but missing for source:", fields.source);
    return "";
  }
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
  // Handle Meta source mapping
  let sourceName = fields.source;
  if (fields.source === "meta_abo" || fields.source === "meta_cbo") {
    sourceName = "meta";
  }
  urlObj.searchParams.set("utm_source", sourceName);
  urlObj.searchParams.set("utm_medium", fields.medium);
  
  // Handle Bing campaign name modification
  let campaignName = fields.campaign;
  if (fields.source === "bing") {
    campaignName = fields.campaign + "_Bing";
  }
  
  // Handle Meta ABO/CBO logic
  if (fields.source === "meta_abo") {
    urlObj.searchParams.set("utm_campaign", "{campaign.name}");
    urlObj.searchParams.set("utm_content", "{adset.name}");
  } else if (fields.source === "meta_cbo") {
    urlObj.searchParams.set("utm_campaign", "{adset.name}");
    urlObj.searchParams.set("utm_content", "{ad.name}");
  } else {
    urlObj.searchParams.set("utm_campaign", campaignName);
  }
  
  if (fields.content) urlObj.searchParams.set("utm_content", fields.content);
  
  // Add required parameters based on source and medium
  const requiredParams = requiredParamsBySourceMedium[fields.source]?.[fields.medium] || [];
  requiredParams.forEach(param => {
    switch (param) {
      case "utm_term":
        urlObj.searchParams.set("utm_term", "{keyword}");
        break;
      case "utm_geo":
        urlObj.searchParams.set("utm_geo", "{loc_physical_ms}");
        break;
      case "utm_device":
        urlObj.searchParams.set("utm_device", "{device}");
        break;
      case "utm_network":
        urlObj.searchParams.set("utm_network", "{network}");
        break;
      case "utm_placement":
        urlObj.searchParams.set("utm_placement", "{placement}");
        break;
      case "utm_content":
        if (fields.medium === "gdn") {
          urlObj.searchParams.set("utm_content", "{text_field}");
        }
        break;
    }
  });
  
  // Add other custom fields
  if (fields.utm_term) urlObj.searchParams.set("utm_term", fields.utm_term);
  if (fields.placement) urlObj.searchParams.set("placement", fields.placement);
  if (fields.audience_segment) urlObj.searchParams.set("audience_segment", fields.audience_segment);
  
  // Fix URL encoding for bracket parameters
  let urlString = urlObj.toString();
  urlString = urlString.replace(/%7B/g, '{').replace(/%7D/g, '}');
  
  // Additional bracket parameter fixes for Meta and other dynamic parameters
  urlString = urlString.replace(/%7Bcampaign\.name%7D/g, '{campaign.name}');
  urlString = urlString.replace(/%7Badset\.name%7D/g, '{adset.name}');
  urlString = urlString.replace(/%7Bad\.name%7D/g, '{ad.name}');
  urlString = urlString.replace(/%7Bkeyword%7D/g, '{keyword}');
  urlString = urlString.replace(/%7Bloc_physical_ms%7D/g, '{loc_physical_ms}');
  urlString = urlString.replace(/%7Bdevice%7D/g, '{device}');
  urlString = urlString.replace(/%7Bnetwork%7D/g, '{network}');
  urlString = urlString.replace(/%7Bplacement%7D/g, '{placement}');
  urlString = urlString.replace(/%7Btext_field%7D/g, '{text_field}');
  
  return urlString;
}

const initialFields: { [key: string]: string } = {
  url: "",
  source: "",
  medium: "",
  campaign: "",
  content: "",
};

// UTM source options
const sourceOptions = [
  "google", "bing", "linkedin", "meta_abo", "meta_cbo", "reddit", "youtube", "community", "academy", "docs", "blog"
];

// UTM medium options by source
const mediumBySource: Record<string, string[]> = {
  google: ["search", "pmcs", "gdn", "demandgen", "video"],
  bing: ["search"],
  linkedin: ["paid_social", "social", "referral", "influencer", "retargeting"],
  meta_abo: ["paid"],
  meta_cbo: ["paid"],
  reddit: ["paid_social", "retargeting", "referral"],
  youtube: ["video", "retargeting", "referral"],
  community: ["referral", "internal-link", "engagement"],
  academy: ["internal-link", "product-message", "onboarding"],
  docs: ["internal-link", "product-message", "technical-content"],
  blog: ["internal-link", "thought-leadership", "seo-cta", "referral"]
};

// Required UTM parameters by source and medium
const requiredParamsBySourceMedium: Record<string, Record<string, string[]>> = {
  google: {
    search: ["utm_term", "utm_geo", "utm_device"],
    demandgen: ["utm_geo", "utm_device"],
    video: ["utm_network", "utm_placement", "utm_geo", "utm_device"],
    gdn: ["utm_content"],
    pmcs: []
  },
  bing: {
    search: ["utm_term"]
  }
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

// Preset definitions for bulk generator
const bulkPresets = [
  {
    name: "Paid Ads",
    sources: ["google", "bing", "linkedin", "meta_abo", "meta_cbo"],
    mediums: ["search", "paid_social", "display", "retargeting", "paid"],
  },
  {
    name: "Social",
    sources: ["linkedin", "meta_abo", "meta_cbo", "reddit", "youtube"],
    mediums: ["paid_social", "social", "influencer", "referral", "retargeting", "paid"],
  },
  {
    name: "Content",
    sources: ["community", "academy", "docs", "blog"],
    mediums: ["referral", "internal-link", "product-message", "technical-content"],
  },
];

// Tooltip table content
const utmFieldTable = [
  { field: 'utm_source', required: true, desc: 'Where the traffic comes from (e.g., google, linkedin, meta)' },
  { field: 'utm_medium', required: true, desc: 'The channel or type of traffic (e.g., cpc, email, social, referral)' },
  { field: 'utm_campaign', required: true, desc: 'Name of the marketing initiative (e.g., q3_launch, summer_promo)' },
  { field: 'utm_content', required: false, desc: 'Used for A/B testing or differentiating creatives (e.g., blue_cta, version_b)' },
  { field: 'utm_term', required: false, desc: 'Used for paid search to capture keywords or targeting terms' },
];
const advancedFields: { field: string; desc: string }[] = [];

export default function Home() {
  const [fields, setFields] = useState<{ [key: string]: string }>(initialFields);
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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [bulkAdvancedFields, setBulkAdvancedFields] = useState<{ [key: string]: string }>({});
  const [generating, setGenerating] = useState(false);

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
    // Fetch all existing UTMs for these URLs and campaign
    const { data: existingUtms } = await supabase
      .from("utms")
      .select("website_url, utm_source, utm_medium, utm_campaign, utm_content").in("website_url", urls).eq("utm_campaign", bulkCampaign);
    urls.forEach(url => {
      bulkSources.forEach(source => {
        bulkMediums.forEach(medium => {
          const content = '';
          const exists = existingUtms && existingUtms.some(u =>
            u.website_url === url &&
            u.utm_source === source &&
            u.utm_medium === medium &&
            u.utm_campaign === bulkCampaign &&
            (u.utm_content || '') === content
          );
          if (!exists) {
            // Use the same buildUtmUrl function for consistency
            const utm = buildUtmUrl({ 
              url, 
              source, 
              medium, 
              campaign: bulkCampaign, 
              content,
              utm_term: '',
              placement: '',
              audience_segment: ''
            });
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
          }
        });
      });
    });
    setBulkResults(combos);
    if (inserts.length) {
      await supabase.from("utms").insert(inserts);
    }
  };

  // Handle preset click
  const handlePresetClick = (presetName: string) => {
    const preset = bulkPresets.find(p => p.name === presetName);
    if (preset) {
      setBulkSources(preset.sources);
      setBulkMediums(preset.mediums);
      setSelectedPreset(presetName);
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
    if (e.target.name === "url") {
      setUrlError("");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleGenerate called with fields:", fields);
    
    if (!fields.url || !isValidUrlOrDomain(fields.url)) {
      console.log("Invalid URL:", fields.url);
      setUrlError("Please enter a valid URL or domain.");
      return;
    }
    
    // Only require campaign if not meta_abo or meta_cbo
    if ((fields.source !== "meta_abo" && fields.source !== "meta_cbo") && !fields.campaign) {
      console.log("Campaign required but missing for source:", fields.source);
      setUrlError("Please select or enter a campaign.");
      return;
    }
    
    setGenerating(true);
    try {
      console.log("Building UTM URL...");
      const url = buildUtmUrl(fields);
      console.log("Generated URL:", url);
      
              if (url) {
          console.log("URL generated successfully, checking for duplicates...");
          
          // Check for duplicate
          const { data: existing, error: duplicateError } = await supabase.from("utms").select("id").match({
            website_url: fields.url,
            utm_source: fields.source,
            utm_medium: fields.medium,
            utm_campaign: fields.campaign,
            utm_content: fields.content || null,
          });
          
          if (duplicateError) {
            console.error("Error checking for duplicates:", duplicateError);
          } else {
            console.log("Duplicate check result:", existing);
          }
          
          if (!existing || existing.length === 0) {
            console.log("No duplicates found, inserting new UTM...");
            const { error: insertError } = await supabase.from("utms").insert([
              {
                website_url: fields.url,
                utm_source: fields.source,
                utm_medium: fields.medium,
                utm_campaign: fields.campaign,
                utm_content: fields.content || null,
              },
            ]);
            
            if (insertError) {
              console.error("Error inserting UTM:", insertError);
            } else {
              console.log("UTM inserted successfully");
            }
          } else {
            console.log("Duplicate UTM found, not inserting");
            alert("This UTM already exists and will not be saved again.");
          }
          
          // Refresh saved UTMs
          console.log("Refreshing saved UTMs...");
          const { data, error: refreshError } = await supabase
            .from("utms")
            .select("id, utm_source, utm_medium, utm_campaign, utm_content, created_at")
            .eq("website_url", fields.url)
            .order("created_at", { ascending: false });
            
          if (refreshError) {
            console.error("Error refreshing saved UTMs:", refreshError);
          } else {
            console.log("Saved UTMs refreshed:", data);
            setSavedUtms(data || []);
          }
        } else {
          console.log("No URL generated, skipping save");
        }
    } catch (error) {
      console.error("Error in handleGenerate:", error);
    } finally {
      setGenerating(false);
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
      <div className="w-full max-w-5xl mx-auto flex flex-row items-center justify-end mb-2 mt-[30px]">
        <span className="text-[#b5bac1] text-sm font-semibold">Advanced Mode</span>
        <label className="relative inline-flex items-center cursor-pointer ml-2">
          <input type="checkbox" checked={advancedMode} onChange={e => setAdvancedMode(e.target.checked)} className="sr-only peer" />
          <div className="w-11 h-6 bg-[#383a40] peer-focus:outline-none rounded-full peer peer-checked:bg-[#19d89f] transition"></div>
          <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
        </label>
      </div>
      {/* Tabs + Generator Container */}
      <div className="w-[90%] max-w-5xl mx-auto mt-8">
        <div className="flex w-full items-center">
          <button
            className={`flex-1 py-3 rounded-tl-lg rounded-tr-none font-semibold border-b-2 transition ${activeTab === 'single' ? 'bg-[#23272a] text-[#f2f3f5] border-[#19d89f]' : 'bg-[#2b2d31] text-[#b5bac1] border-transparent'}`}
            onClick={() => setActiveTab('single')}
            style={{ borderRight: '1px solid #23272a' }}
          >Single</button>
          <button
            className={`flex-1 py-3 rounded-tr-lg rounded-tl-none font-semibold border-b-2 transition flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-[#23272a] text-[#f2f3f5] border-[#19d89f]' : 'bg-[#2b2d31] text-[#b5bac1] border-transparent'}`}
            onClick={() => setActiveTab('bulk')}
            style={{ borderLeft: '1px solid #23272a' }}
          >
            Bulk
          </button>
        </div>
        <div className="bg-[#23272a] shadow-md rounded-b-lg p-6 w-full min-h-auto flex flex-col justify-start relative">
          {/* Always show '? Need some help?' in top right, 15px from top/right */}
          <div className="absolute" style={{ top: 15, right: 15, zIndex: 10 }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Show UTM field help"
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[#23272a] border border-[#42454a] text-[#19d89f] text-xs font-bold cursor-pointer hover:bg-[#383a40] focus:outline-none"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                tabIndex={0}
                style={{ position: 'relative' }}
              >
                ?
              </button>
              <span className="text-[#b5bac1] text-xs font-semibold select-none">Need some help?</span>
              {showTooltip && (
                <div className="absolute right-0 top-8 z-50 bg-[#23272a] border border-[#42454a] rounded shadow-lg p-3 text-xs text-[#f2f3f5] min-w-[420px]" style={{ whiteSpace: 'normal' }}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left pb-1">Field</th>
                        <th className="text-left pb-1">Required</th>
                        <th className="text-left pb-1">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utmFieldTable.map(row => (
                        <tr key={row.field}>
                          <td className="pr-2 font-mono text-[#19d89f]">{row.field}</td>
                          <td className="pr-2">{row.required ? '✅ Yes' : '❌ Optional'}</td>
                          <td>{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {/* Add extra space above generator fields */}
          <div className="mt-4">
            {/* Single Tab */}
            {activeTab === 'single' && (
              <form className="flex flex-row flex-wrap gap-3 w-full items-end" onSubmit={handleGenerate}>
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
                {fields.source !== "meta_abo" && fields.source !== "meta_cbo" && (
                  <div className="flex flex-col w-48">
                    <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor="campaign">
                      Campaign <span className="text-red-400">*</span>
                    </label>
                    {advancedMode ? (
                      <input
                        className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                        id="campaign"
                        name="campaign"
                        type="text"
                        required
                        value={fields.campaign}
                        onChange={handleChange}
                        placeholder="Enter campaign name"
                      />
                    ) : (
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
                    )}
                  </div>
                )}
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
                {fields.medium !== "search" && fields.source !== "meta_abo" && fields.source !== "meta_cbo" && (
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
                      placeholder="Enter content (optional)"
                    />
                  </div>
                )}
                {advancedMode && (
                  <div className="flex flex-wrap gap-4 w-full mt-2">
                    {advancedFields.map(f => (
                      <div className="flex flex-col w-40" key={f.field}>
                        <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor={f.field}>{f.field}</label>
                        <input
                          className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                          id={f.field}
                          name={f.field}
                          type="text"
                          value={fields[f.field] || ''}
                          onChange={handleChange}
                          placeholder={f.desc}
                          style={{ display: fields.medium === "search" && f.field === "placement" ? "none" : "block" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* Live UTM Preview (hidden on mobile and in advanced mode) */}
                {!advancedMode && (
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
                        {/* Show automatic parameters based on source/medium */}
                        {(() => {
                          const requiredParams = requiredParamsBySourceMedium[fields.source]?.[fields.medium] || [];
                          return requiredParams.map((param, idx) => {
                            let paramValue = '';
                            switch (param) {
                              case "utm_term":
                                paramValue = "{keyword}";
                                break;
                              case "utm_geo":
                                paramValue = "{loc_physical_ms}";
                                break;
                              case "utm_device":
                                paramValue = "{device}";
                                break;
                              case "utm_network":
                                paramValue = "{network}";
                                break;
                              case "utm_placement":
                                paramValue = "{placement}";
                                break;
                              case "utm_content":
                                if (fields.medium === "gdn") {
                                  paramValue = "{text_field}";
                                }
                                break;
                            }
                            if (!paramValue) return null;
                            return (
                              <motion.span
                                key={param}
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut', delay: 0.3 + idx * 0.07 }}
                                className="inline-block"
                                style={{ color: '#19d89f' }}
                              >
                                &amp;{param}={paramValue}
                              </motion.span>
                            );
                          });
                        })()}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full h-10 px-6 bg-[#19d89f] hover:bg-[#15b87f] text-white font-bold rounded focus:outline-none focus:ring-2 focus:ring-[#19d89f] transition flex items-center justify-center"
                  disabled={generating}
                >
                  {generating ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  ) : null}
                  {generating ? "Generating..." : "Generate UTM"}
                </button>
              </form>
            )}
            {/* Bulk Tab */}
            {activeTab === 'bulk' && (
              <div className="flex flex-col gap-6 w-full">
                <div className="text-[#b5bac1] text-xs font-bold mb-1" style={{ marginBottom: '4px' }}>Get started with a preset</div>
                <div className="flex gap-2 mb-2">
                  {bulkPresets.map(preset => {
                    const isActive = selectedPreset === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetClick(preset.name)}
                        className={`relative font-semibold text-sm transition focus:outline-none rounded-full`}
                        style={{
                          background: isActive ? 'linear-gradient(90deg, #19d89f 0%, #158f6b 100%)' : 'none',
                          padding: '2px',
                          border: isActive ? '2px solid #19d89f' : '1px solid #42454a',
                          borderRadius: '9999px',
                          display: 'inline-block',
                        }}
                      >
                        <span
                          className="block rounded-full px-5 py-2 w-full h-full"
                          style={{
                            background: isActive ? 'transparent' : '#23272a',
                            fontWeight: 600,
                            color: '#f2f3f5',
                            transition: 'background 0.2s, color 0.2s',
                          }}
                        >
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={handleBulkGenerate} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[#b5bac1] text-xs font-bold mb-1">URLs (one per line)</label>
                    <textarea
                      className="w-full min-h-[80px] max-h-40 border border-[#42454a] rounded bg-[#383a40] text-[#f2f3f5] px-3 py-2 text-xs font-mono"
                      value={bulkUrls}
                      onChange={e => setBulkUrls(e.target.value)}
                      placeholder="enter each URL on a new line"
                    />
                  </div>
                  <div>
                    <label className="block text-[#b5bac1] text-xs font-bold mb-1">Campaign</label>
                    {advancedMode ? (
                      <input
                        className="w-full border border-[#42454a] rounded bg-[#383a40] text-[#f2f3f5] px-3 py-2"
                        type="text"
                        value={bulkCampaign}
                        onChange={e => setBulkCampaign(e.target.value)}
                        placeholder="Enter campaign name"
                      />
                    ) : (
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
                    )}
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
                  {advancedMode && (
                    <div className="w-full mt-2">
                      <div className="text-[#b5bac1] text-xs font-bold mb-1">Advanced Fields</div>
                      <div className="flex flex-wrap gap-4 w-full">
                        {advancedFields.map(f => (
                          <div className="flex flex-col w-40" key={f.field}>
                            <label className="block text-[#b5bac1] text-xs font-bold mb-1" htmlFor={`bulk_${f.field}`}>{f.field}</label>
                            <input
                              className="shadow appearance-none border border-[#42454a] rounded bg-[#383a40] w-full py-2 px-3 text-[#f2f3f5] leading-tight focus:outline-none focus:ring-2 focus:ring-[#5865f2]"
                              id={`bulk_${f.field}`}
                              name={`bulk_${f.field}`}
                              type="text"
                              value={bulkAdvancedFields[f.field] || ''}
                              onChange={e => setBulkAdvancedFields({ ...bulkAdvancedFields, [f.field]: e.target.value })}
                              placeholder={f.desc}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
          </div>
        </div>
        {/* Saved UTMs */}
        <div className="flex-1">
          {activeTab === 'single' && (
            <div className="w-full mt-0 md:mt-6 bg-[#23272a] rounded shadow px-6 py-6 text-[#f2f3f5]">
              <h2 className="text-lg font-semibold mb-2" style={{ color: '#19d89f' }}>Saved UTMs for this URL</h2>
              {fields.url && (
                <a
                  href={`/all-utms?website_url=${encodeURIComponent(fields.url)}`}
                  className="text-[#19d89f] underline text-xs mb-2 inline-block hover:text-[#15b87f]"
                  style={{ marginBottom: 8 }}
                >
                  View all UTMs for this page
                </a>
              )}
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
          )}
        </div>
        <JoeAvatar />
      </div>
    </div>
  );
}
