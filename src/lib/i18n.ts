export type Locale = "pt" | "en";

export const dictionaries = {
  pt: {
    languageToggle: "EN",
    themeToggleToDark: "DARK",
    themeToggleToLight: "LIGHT",
    upmLabel: "Mackenzie",
    papelzinhoLabel: "Papelzinho",
    orlaLabel: "Orla",
    appleDeveloperAcademyLabel: "Apple Developer Academy",
    welcome: "Bem-vindo",
    intro: [
      "Me chamo Gustavo Galego,\nmas todo mundo me chama de Guga!",
      "Crio produtos com foco em simplicidade, praticidade e atenção aos detalhes.",
      "Hoje, eu trabalho no {UPM},\najudando na criação do {SME}.",
      "Anteriormente, trabalhei na criação do {PAPELZINHO}, na {ORLA}. Também sou alumni da {ADA}.",
    ],
    sections: {
      design: "DESIGN",
      dev: "DEV",
      about: "SOBRE",
      cv: "CV",
    },
    skipToContent: "Saltar para o conteúdo",
    projectEmptyCms:
      "Ainda não há conteúdo para este projeto. Edita no CMS.",
    carouselPrevious: "Slide anterior",
    carouselNext: "Slide seguinte",
    sobreCaptionLine: "Experiência",
    sobreCaptionIconClass: "ri-arrow-down-s-line",
    sobreExperienciaEntries: [
      {
        yearLines: ["2026"],
        org: "Mackenzie",
        body: "Atualmente, trabalho na Universidade Presbiteriana Mackenzie, mais especificamente, no Sistema de Ensino Mackenzie (SME), onde desenvolvo o design de diversas plataformas de ensino para centenas de escolas.",
      },
      {
        yearLines: ["2025", "2024"],
        org: "Orla",
        body: "Na Orla atuei principalmente no desenvolvimento do app Papelzinho, o maior app de amigo secreto do mercado. Sigo cuidando de toda a parte de UX/UI, garantindo que o visual e a experiência do app evoluam sempre de forma consistente e alinhada com quem usa.",
      },
      {
        yearLines: ["2024", "2023"],
        org: "Apple Developer Academy",
        body: "Na Apple Developer Academy, mergulhei no design e desenvolvimento de apps para o ecossistema Apple, sempre unindo criatividade e funcionalidade. Liderei projetos, conduzi testes com usuários e criei soluções do zero, focando em transformar boas ideias em experiências reais e intuitivas.",
      },
    ],
  },
  en: {
    languageToggle: "PT",
    themeToggleToDark: "DARK",
    themeToggleToLight: "LIGHT",
    upmLabel: "Mackenzie",
    papelzinhoLabel: "Papelzinho",
    orlaLabel: "Orla",
    appleDeveloperAcademyLabel: "Apple Developer Academy",
    welcome: "Welcome",
    intro: [
      "I'm Gustavo Galego,\nbut everyone calls me Guga!",
      "I build products with a focus on simplicity, practicality and attention to detail.",
      "Today I work at {UPM},\nhelping to build {SME}.",
      "Previously, I worked on {PAPELZINHO} at {ORLA}. I'm also an alumnus of the {ADA}.",
    ],
    sections: {
      design: "DESIGN",
      dev: "DEV",
      about: "ABOUT",
      cv: "CV",
    },
    skipToContent: "Skip to content",
    projectEmptyCms:
      "There is no content for this project yet. Edit it in the CMS.",
    carouselPrevious: "Previous slide",
    carouselNext: "Next slide",
    sobreCaptionLine: "Experience",
    sobreCaptionIconClass: "ri-arrow-down-s-line",
    sobreExperienciaEntries: [
      {
        yearLines: ["2026"],
        org: "Mackenzie",
        body: "I currently work at Mackenzie Presbyterian University, specifically within the Mackenzie Education System (SME), where I lead design for multiple learning platforms used by hundreds of schools.",
      },
      {
        yearLines: ["2025", "2024"],
        org: "Orla",
        body: "At Orla I focused mainly on building Papelzinho, the leading secret-santa app on the market. I still own UX/UI end to end, keeping the look and feel evolving in a consistent way that stays true to the people who use it.",
      },
      {
        yearLines: ["2024", "2023"],
        org: "Apple Developer Academy",
        body: "At the Apple Developer Academy I went deep on designing and building apps for the Apple ecosystem, balancing creativity with craft. I led projects, ran user tests, and shipped solutions from scratch, turning strong ideas into intuitive, real-world experiences.",
      },
    ],
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
