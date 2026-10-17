import { notFound } from "next/navigation";
import PublicPortfolioView from "../../components/public-portfolio-view";
import { getSupabase } from "../../lib/supabase";

// Public portfolio page component for displaying a user's portfolio based on the slug.

export const dynamic = "force-dynamic";

async function getPortfolio(slug) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("portfolios")
    .select("slug, theme, profile, selected_projects")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Public portfolio load failed:", error);
    return null;
  }

  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);

  return {
    title: portfolio?.profile?.name
      ? `${portfolio.profile.name} - Portfolio`
      : "Portfolio",
  };
}

export default async function PublicPortfolioPage({ params }) {
  const { slug } = await params;
  const portfolio = await getPortfolio(slug);

  if (!portfolio) notFound();

  return (
    <PublicPortfolioView
      profile={portfolio.profile}
      projects={portfolio.selected_projects}
      slug={portfolio.slug}
      theme={portfolio.theme}
    />
  );
}
