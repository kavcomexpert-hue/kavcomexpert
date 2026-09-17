import { PageSkeleton } from "@/components/site/page-skeleton";

export default function SiteLoading() {
  return <PageSkeleton cardCount={3} cardLayout="grid" />;
}
