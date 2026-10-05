"use client";

import Link from "next/link";
import { useEffect } from "react";

import { aboutLetter } from "@/lib/about-letter";
import { useBharatState } from "@/lib/chat-store";
import type { Lang } from "@/lib/copy";

type AboutCopy = {
  kicker: string;
  back: string;
  name: string;
  role: string;
  intro: string;
  facts: { label: string; value: string; wide?: boolean }[];
  learnTitle: string;
  father: string;
  work: string;
  skillsTitle: string;
  skills: string[];
};

const story: Record<Lang, AboutCopy> = {
  en: {
    kicker: "About",
    back: "Back",
    name: "Luqman Inamdar",
    role: "Class 8 student",
    intro: "I study at G.H.S. Kalay and I am learning to build for the web. Susegad is the project I am working on now.",
    facts: [
      { label: "Age", value: "13" },
      { label: "Class", value: "8" },
      { label: "School", value: "G.H.S. Kalay", wide: true },
      { label: "Languages", value: "English, Hindi, Konkani", wide: true },
    ],
    learnTitle: "How I learn",
    father: "The first teacher of my life is my father.",
    work: "With his guidance, and with steady hard work, I keep pushing myself to grow.",
    skillsTitle: "Skills",
    skills: ["HTML", "CSS", "JavaScript", "Next.js"],
  },
  hi: {
    kicker: "परिचय",
    back: "वापस",
    name: "लुकमान इनामदार",
    role: "कक्षा 8 के छात्र",
    intro: "मैं G.H.S. कालय में पढ़ता हूँ और वेब बनाना सीख रहा हूँ। सुसेगाद वह प्रोजेक्ट है जिस पर मैं अभी काम कर रहा हूँ।",
    facts: [
      { label: "उम्र", value: "13" },
      { label: "कक्षा", value: "8" },
      { label: "स्कूल", value: "G.H.S. कालय", wide: true },
      { label: "भाषाएँ", value: "अंग्रेज़ी, हिंदी, कोंकणी", wide: true },
    ],
    learnTitle: "मैं कैसे सीखता हूँ",
    father: "मेरी ज़िंदगी के पहले गुरु मेरे पिता हैं।",
    work: "उनके मार्गदर्शन से, और अपनी मेहनत से, मैं अपने आप को आगे बढ़ने के लिए प्रेरित करता रहता हूँ।",
    skillsTitle: "कौशल",
    skills: ["HTML", "CSS", "JavaScript", "Next.js"],
  },
  kok: {
    kicker: "परिचय",
    back: "परत",
    name: "लुक्मान इनामदार",
    role: "इयत्ता 8 वो विद्यार्थी",
    intro: "हांव G.H.S. काळाय हांगा शिकटा आनी वेब तयार करप शिकटा. सुसेगाद तो प्रकल्प जाचेर हांव आतां काम करता.",
    facts: [
      { label: "पिराय", value: "13" },
      { label: "इयत्ता", value: "8" },
      { label: "शाळा", value: "G.H.S. काळाय", wide: true },
      { label: "भाशो", value: "इंग्लीश, हिंदी, कोंकणी", wide: true },
    ],
    learnTitle: "हांव कशें शिकता",
    father: "म्हज्या जिवितांतलो पयलो गुरु म्हजो बापूय.",
    work: "तांच्या मार्गदर्शनांत, आनी म्हज्या मेहनतीन, हांव आपणाक वाडपाक धुकळत रावता.",
    skillsTitle: "कौशल्य",
    skills: ["HTML", "CSS", "JavaScript", "Next.js"],
  },
  mr: {
    kicker: "परिचय",
    back: "परत",
    name: "लुकमान इनामदार",
    role: "इयत्ता 8 चा विद्यार्थी",
    intro: "मी G.H.S. काळाय येथे शिकतो आणि वेब तयार करायला शिकत आहे. सुसेगाद हा प्रकल्प आहे ज्यावर मी आत्ता काम करत आहे.",
    facts: [
      { label: "वय", value: "१३" },
      { label: "इयत्ता", value: "८" },
      { label: "शाळा", value: "G.H.S. काळाय", wide: true },
      { label: "भाषा", value: "इंग्रजी, हिंदी, कोंकणी", wide: true },
    ],
    learnTitle: "मी कसे शिकतो",
    father: "माझ्या आयुष्यातील पहिले गुरु माझे वडील आहेत.",
    work: "त्यांच्या मार्गदर्शनाने, आणि स्वतःच्या मेहनतीने, मी स्वतःला वाढण्यासाठी प्रेरित करत राहतो.",
    skillsTitle: "कौशल्ये",
    skills: ["HTML", "CSS", "JavaScript", "Next.js"],
  },
};

export function AboutPage() {
  const state = useBharatState();
  const text = story[state.lang];
  const english = state.lang === "en";

  useEffect(() => {
    document.documentElement.lang =
      state.lang === "kok" ? "kok" : state.lang === "mr" ? "mr" : state.lang === "hi" ? "hi" : "en";
  }, [state.lang]);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-indigo">
      <div className="tide-bar shrink-0" />
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]">
        <aside className="shore relative flex flex-col overflow-hidden px-6 py-6 text-[#f7f3ea] sm:px-8 sm:py-8 lg:sticky lg:top-0 lg:h-dvh lg:px-10 lg:py-10">
          <p aria-hidden="true" className="pointer-events-none absolute -right-3 bottom-0 font-display text-[8.5rem] leading-none text-white/[0.06] sm:text-[11rem]">
            LI
          </p>
          <div className="relative flex items-center justify-between gap-4">
            <Link
              href="/"
              aria-label={text.back}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#f2c98a]/40 bg-white/5 text-lg"
            >
              ←
            </Link>
            <p className={`text-xs font-semibold text-[#f2c98a] ${english ? "uppercase tracking-[0.22em]" : ""}`}>{text.kicker}</p>
          </div>
          <div className="relative flex flex-1 flex-col justify-center py-10 lg:py-0">
            <div className="grid h-24 w-24 place-items-center rounded-[1.6rem] border border-[#f2c98a]/50 bg-[#041f25] font-display text-4xl tracking-wide text-[#f2c98a] shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              LI
            </div>
            <h1 className="font-display mt-6 max-w-xs text-5xl leading-[0.95] tracking-wide sm:text-6xl">{text.name}</h1>
            <p className="mt-4 text-base font-medium text-[#f2c98a]">{text.role}</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#d7ebe6]">{text.intro}</p>
          </div>
        </aside>

        <main className="flex flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <ul className="grid grid-cols-2 gap-3">
            {text.facts.map((fact) => (
              <li key={fact.label} className={`rounded-3xl border border-line bg-white/70 px-5 py-4 ${fact.wide ? "col-span-2 sm:col-span-1" : ""}`}>
                <p className={`text-xs font-semibold text-peacock ${english ? "uppercase tracking-[0.16em]" : ""}`}>{fact.label}</p>
                <p className="font-display mt-2 text-2xl leading-tight tracking-wide sm:text-3xl">{fact.value}</p>
              </li>
            ))}
          </ul>

          <section className="rounded-[1.8rem] bg-[#041f25] px-6 py-7 text-[#f7f3ea] shadow-[0_18px_40px_rgba(8,52,60,0.16)] sm:px-8">
            <h2 className={`text-xs font-semibold text-[#f2c98a] ${english ? "uppercase tracking-[0.18em]" : ""}`}>{text.learnTitle}</h2>
            <p className="font-display mt-4 max-w-2xl text-3xl leading-snug tracking-wide sm:text-4xl">{text.father}</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#d7ebe6]">{text.work}</p>
          </section>

          <section>
            <h2 className={`text-xs font-semibold text-peacock ${english ? "uppercase tracking-[0.18em]" : ""}`}>{text.skillsTitle}</h2>
            <ul className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {text.skills.map((skill) => (
                <li key={skill} className="rounded-3xl border border-line bg-white/70 px-4 py-5">
                  <span className="block h-1 w-8 rounded-full bg-gradient-to-r from-marigold to-peacock" />
                  <p className="font-display mt-4 text-2xl leading-none tracking-wide">{skill}</p>
                </li>
              ))}
            </ul>
          </section>

          <article className="max-w-3xl space-y-10 pb-16">
            {aboutLetter[state.lang].map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-3xl leading-tight tracking-wide text-peacock sm:text-4xl">{section.title}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 sm:text-lg">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </main>
      </div>
    </div>
  );
}
