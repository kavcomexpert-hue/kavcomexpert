import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CaseStudySlugRedirect({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/work/${slug}`);
}
