import { CaseStudyEditor } from "@/components/admin/case-study-editor";
import { requirePageSession } from "@/lib/admin/session";
import { canPublish } from "@/lib/authz";
import { EMPTY_CASE_STUDY_DOC } from "@/lib/case-studies/defaults";
import { emptySectionLabels } from "@/lib/case-studies/section-labels";
import { getAdminServices } from "@/lib/queries/admin-content";

export default async function NewCaseStudyPage() {
  const session = await requirePageSession();
  const services = await getAdminServices();

  return (
    <CaseStudyEditor
      canPublish={canPublish(session)}
      services={services.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
      }))}
      initialData={{
        slug: "",
        client: "",
        pageHeading: "",
        industry: "",
        website: "",
        engagementType: "",
        servicesProvided: "",
        location: "",
        platformStack: "",
        infoHeadlineLabel: "",
        infoHeadlineValue: "",
        challenge: "",
        challengeMedia: "",
        approach: EMPTY_CASE_STUDY_DOC,
        approachMedia: "",
        solution: EMPTY_CASE_STUDY_DOC,
        solutionMedia: "",
        clientNoticed: EMPTY_CASE_STUDY_DOC,
        clientNoticedMedia: "",
        sectionLabels: emptySectionLabels(),
        gallery: [],
        clientQuote: { quote: "", name: "", role: "", videoUrl: "" },
        serviceSlugs: [],
        metaTitle: "",
        metaDescription: "",
        focusKeyword: "",
        schemaType: "Article",
        ogImage: "",
        canonicalUrl: "",
        noIndex: false,
        sitemapInclude: true,
        sitemapPriority: "0.7",
        status: "draft",
        scheduledFor: "",
      }}
    />
  );
}
