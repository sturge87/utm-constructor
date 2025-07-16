"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UTM = {
  id: string;
  website_url: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string | null;
  created_at: string;
};

function buildUtmUrl(utm: UTM) {
  const url = new URL(utm.website_url);
  url.searchParams.set("utm_source", utm.utm_source);
  url.searchParams.set("utm_medium", utm.utm_medium);
  url.searchParams.set("utm_campaign", utm.utm_campaign);
  if (utm.utm_content) url.searchParams.set("utm_content", utm.utm_content);
  return url.toString();
}

export default function AllUtmsPage() {
  const [utms, setUtms] = useState<UTM[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    website_url: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("utms")
      .select("id, website_url, utm_source, utm_medium, utm_campaign, utm_content, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUtms(data || []);
        setLoading(false);
      });
  }, []);

  const filteredUtms = utms.filter((utm) =>
    (!filters.website_url || utm.website_url.toLowerCase().includes(filters.website_url.toLowerCase())) &&
    (!filters.utm_source || utm.utm_source === filters.utm_source) &&
    (!filters.utm_medium || utm.utm_medium === filters.utm_medium) &&
    (!filters.utm_campaign || utm.utm_campaign === filters.utm_campaign) &&
    (!filters.utm_content || (utm.utm_content || "").includes(filters.utm_content))
  );

  // Unique values for dropdowns
  const unique = (arr: string[]) => Array.from(new Set(arr)).filter(Boolean);
  const sources = unique(utms.map(u => u.utm_source));
  const mediums = unique(utms.map(u => u.utm_medium));
  const campaigns = unique(utms.map(u => u.utm_campaign));
  const contents = unique(utms.map(u => u.utm_content || ""));

  const handleCopy = async (utm: UTM) => {
    const url = buildUtmUrl(utm);
    await navigator.clipboard.writeText(url);
    setCopiedId(utm.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#313338] p-4 text-[#f2f3f5]">
      <h1 className="text-2xl font-bold mb-6 text-[#f2f3f5]">All Saved UTMs</h1>
      <div className="w-full max-w-6xl bg-[#23272a] rounded shadow p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            className="border border-[#42454a] rounded px-2 py-1 text-xs w-48 bg-[#383a40] text-[#f2f3f5]"
            placeholder="Website URL"
            value={filters.website_url}
            onChange={e => setFilters(f => ({ ...f, website_url: e.target.value }))}
          />
          <select
            className="border border-[#42454a] rounded px-2 py-1 text-xs w-40 bg-[#383a40] text-[#f2f3f5]"
            value={filters.utm_source}
            onChange={e => setFilters(f => ({ ...f, utm_source: e.target.value }))}
          >
            <option value="">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="border border-[#42454a] rounded px-2 py-1 text-xs w-40 bg-[#383a40] text-[#f2f3f5]"
            value={filters.utm_medium}
            onChange={e => setFilters(f => ({ ...f, utm_medium: e.target.value }))}
          >
            <option value="">All Mediums</option>
            {mediums.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            className="border border-[#42454a] rounded px-2 py-1 text-xs w-40 bg-[#383a40] text-[#f2f3f5]"
            value={filters.utm_campaign}
            onChange={e => setFilters(f => ({ ...f, utm_campaign: e.target.value }))}
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="border border-[#42454a] rounded px-2 py-1 text-xs w-40 bg-[#383a40] text-[#f2f3f5]"
            value={filters.utm_content}
            onChange={e => setFilters(f => ({ ...f, utm_content: e.target.value }))}
          >
            <option value="">All Content</option>
            {contents.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="text-[#b5bac1]">Loading...</div>
        ) : filteredUtms.length === 0 ? (
          <div className="text-[#b5bac1]">No UTMs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#383a40] text-[#19d89f]">
                  <TableHead className="p-2 border border-[#42454a]">Website URL</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Source</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Medium</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Campaign</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Content</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Created</TableHead>
                  <TableHead className="p-2 border border-[#42454a]">Copy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUtms.map(utm => (
                  <TableRow key={utm.id} className="even:bg-[#23272a]">
                    <TableCell className="p-2 border border-[#42454a] break-all text-[#f2f3f5]">{utm.website_url}</TableCell>
                    <TableCell className="p-2 border border-[#42454a] text-[#f2f3f5]">{utm.utm_source}</TableCell>
                    <TableCell className="p-2 border border-[#42454a] text-[#f2f3f5]">{utm.utm_medium}</TableCell>
                    <TableCell className="p-2 border border-[#42454a] text-[#f2f3f5]">{utm.utm_campaign}</TableCell>
                    <TableCell className="p-2 border border-[#42454a] text-[#f2f3f5]">{utm.utm_content}</TableCell>
                    <TableCell className="p-2 border border-[#42454a] text-[#b5bac1]">{new Date(utm.created_at).toLocaleString()}</TableCell>
                    <TableCell className="p-2 border border-[#42454a]">
                      <button
                        className={`px-2 py-1 rounded bg-[#19d89f] text-white text-xs font-semibold hover:bg-[#15b87f] transition ${copiedId === utm.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => handleCopy(utm)}
                        type="button"
                      >
                        {copiedId === utm.id ? "Copied!" : "Copy"}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
} 