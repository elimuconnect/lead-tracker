import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

// Use GitHub Actions secrets
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// RSS feeds for all niches
const feeds = [
  // Real Estate
  { url: "https://www.property24.com/articles/rss", niche: "real_estate" },
  { url: "https://www.homely.com.au/blog/rss", niche: "real_estate" },

  // Web Development
  { url: "https://hnrss.org/frontpage", niche: "web_dev" },
  { url: "https://www.smashingmagazine.com/feed/", niche: "web_dev" },

  // Education
  { url: "https://www.edweek.org/feeds/rss/news", niche: "education" },
  { url: "https://www.educationdive.com/rss/all/", niche: "education" }
];

// Auto-detect niche from content (optional, fallback)
function detectNiche(content) {
  content = content.toLowerCase();
  if (content.includes("plot") || content.includes("land")) return "real_estate";
  if (content.includes("developer") || content.includes("website")) return "web_dev";
  if (content.includes("school") || content.includes("student")) return "education";
  return "other";
}

// Calculate a simple lead score
function calculateScore(content) {
  let score = 0;
  content = content.toLowerCase();
  if (content.includes("urgent")) score += 5;
  if (content.includes("cheap")) score += 3;
  if (content.includes("contact")) score += 2;
  return score;
}

async function run() {
  console.log("Fetching RSS feeds...");
  for (const feedSource of feeds) {
    try {
      const feed = await parser.parseURL(feedSource.url);
      for (const item of feed.items) {
        const title = item.title || "";
        const description = item.contentSnippet || "";
        const link = item.link;
        if (!link) continue;

        // Deduplicate by link
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("link", link);

        if (existing.length > 0) continue;

        // Insert lead
        await supabase.from("leads").insert([
          {
            title,
            description,
            niche: feedSource.niche || detectNiche(title + " " + description),
            score: calculateScore(title + " " + description),
            source: feed.title,
            link,
            status: "new"
          }
        ]);
      }
    } catch (err) {
      console.error(`Error fetching ${feedSource.url}:`, err.message);
    }
  }
  console.log("Leads fetched and saved!");
}

// Run the script
run();

async function updateLeadStatus(id, status) {
  await supabaseClient.from("leads").update({ status }).eq("id", id);
  loadLeads(); // refresh dashboard
}

