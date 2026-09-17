export type TestimonialVideo = {
  id: string;
  name: string;
  company: string;
  /** Local path under /public, e.g. /videos/client-story.mp4 */
  videoSrc?: string;
  /** YouTube video ID, used when videoSrc is not set */
  youtubeId?: string;
  /** Optional poster frame under /public */
  posterSrc?: string;
};

export const testimonialVideos: TestimonialVideo[] = [
  {
    id: "Phillips-Business-Group",
    name: "Tiffany Phillips",
    company: "Phillips Business Group",
    youtubeId: "q0gnm8rqBH4",
  },
  {
    id: "Grace-Realty-&-Property-Management",
    name: "Beverly Grace",
    company: "Grace Realty & Property Mgmt",
    youtubeId: "bnMqf2r1yQ0",
  },
  {
    id: "Perfunnle-Inc",
    name: "Kristen Allen Pulanco",
    company: "Perfunnle Inc.",
    youtubeId: "nDNhIcfkLQY",
  },
  {
    id: "Headless-Chicken-Growth-Group",
    name: "Dane Richardshon",
    company: "Headless Chicken Growth Group",
    youtubeId: "wv1C4oUA7pQ",
  },
  

];
