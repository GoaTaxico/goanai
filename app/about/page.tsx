import type { Metadata } from "next";

import { AboutPage } from "@/components/about-page";

export const metadata: Metadata = {
  title: "About me",
  description:
    "Luqman Inamdar is a Class 8 student at G.H.S. Kalay. He is 13, speaks English, Hindi, and Konkani, and builds with HTML, CSS, JavaScript, and Next.js.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <AboutPage />;
}
