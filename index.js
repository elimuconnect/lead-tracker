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

  // 🏡 REAL ESTATE (renting, buying, Airbnb, etc.)
  if (
    content.includes("house for sale") ||
    content.includes("house to rent") ||
    content.includes("apartment for rent") ||
    content.includes("apartment for sale") ||
    content.includes("bedsitter") ||
    content.includes("single room") ||
    content.includes("1 bedroom") ||
    content.includes("2 bedroom") ||
    content.includes("3 bedroom") ||
    content.includes("4 bedroom") ||
    content.includes("studio apartment") ||
    content.includes("airbnb") ||
    content.includes("bnb") ||
    content.includes("short stay") ||
    content.includes("rental house") ||
    content.includes("property for sale") ||
    content.includes("property to let") ||
    content.includes("plots for sale") ||
    content.includes("land for sale") ||
    content.includes("looking for house") ||
    content.includes("need a house") ||
    content.includes("looking for apartment") ||
    content.includes("office space for rent") ||
    content.includes("shop for rent")
  ) {
    return "real_estate";
  }

  // 💻 WEB / APP DEVELOPMENT (people needing services)
  if (
    content.includes("need a website") ||
    content.includes("build me a website") ||
    content.includes("looking for a developer") ||
    content.includes("hire a developer") ||
    content.includes("web developer needed") ||
    content.includes("website design") ||
    content.includes("create website") ||
    content.includes("build website") ||
    content.includes("web app development") ||
    content.includes("mobile app development") ||
    content.includes("android app") ||
    content.includes("ios app") ||
    content.includes("system development") ||
    content.includes("software developer needed") ||
    content.includes("freelance developer") ||
    content.includes("ecommerce website") ||
    content.includes("online store website") ||
    content.includes("shopify store") ||
    content.includes("wordpress website") ||
    content.includes("fix my website") ||
    content.includes("website redesign") ||
    content.includes("saas platform") ||
    content.includes("booking system") ||
    content.includes("school system")
  ) {
    return "web_dev";
  }

  // 🎓 ONLINE TUITION (clear demand for learning help)
  if (
    content.includes("need a tutor") ||
    content.includes("looking for a tutor") ||
    content.includes("online tuition") ||
    content.includes("home tuition") ||
    content.includes("private tutor") ||
    content.includes("math tutor") ||
    content.includes("english tutor") ||
    content.includes("science tutor") ||
    content.includes("tuition teacher") ||
    content.includes("cbc tutor") ||
    content.includes("kcse tutor") ||
    content.includes("primary tutor") ||
    content.includes("high school tutor") ||
    content.includes("revision classes") ||
    content.includes("coaching classes") ||
    content.includes("online classes") ||
    content.includes("learn from home") ||
    content.includes("assignment help") ||
    content.includes("exam preparation") ||
    content.includes("holiday tuition") ||
    content.includes("part time tutor") ||
    content.includes("zoom classes")
  ) {
    return "online_tuition";
  }

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

