import { PageSkeleton } from "@/components/site/page-skeleton";

export default function BlogLoading() {
  return <PageSkeleton cardCount={6} cardLayout="grid" />;
}
