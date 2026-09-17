import { SocialIconLinks } from "@/components/site/social-icons";
import type { SocialLinks } from "@/lib/queries/site-settings";

export function ContactSocialLinks({
  socialLinks,
}: {
  socialLinks: SocialLinks;
}) {
  const hasAny =
    Boolean(socialLinks.linkedin) ||
    Boolean(socialLinks.facebook) ||
    Boolean(socialLinks.instagram);

  if (!hasAny) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">Follow along</p>
      <p className="mt-1 text-sm text-muted">
        LinkedIn, Facebook, and Instagram.
      </p>
      <SocialIconLinks socialLinks={socialLinks} className="mt-4" />
    </div>
  );
}
