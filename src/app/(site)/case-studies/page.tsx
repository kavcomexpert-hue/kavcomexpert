import { permanentRedirect } from "next/navigation";

export default function CaseStudiesIndexRedirect() {
  permanentRedirect("/work");
}
