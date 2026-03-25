import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "sb_publishable__8UDz84D_7v9GqgTRP9CiA_RA_Aj87g"
);

const feeds = [
  { url: "https://hnrss.org/jobs", niche: "web_dev" },
  { url: "https://www.property24.com/articles/rss", niche: "real_estate" },
  { url: "https://www.edweek.org/feeds/rss/news", niche: "education" }
];

async function run() {
  for (let feedSource of feeds) {
    const feed = await parser.parseURL(feedSource.url);
    for (let item of feed.items) {
      const title = item.title || "";
      const description = item.contentSnippet || "";
      const link = item.link;
      if (!link) continue;

      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("link", link);

      if (existing.length > 0) continue;

      await supabase.from("leads").insert([
        {
          title,
          description,
          source: feed.title,
          link
        }
      ]);
    }
  }
  console.log("Leads fetched and saved!");
}

run();
