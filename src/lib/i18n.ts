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
      "Me chamo Gustavo Galego, mas todo mundo me chama de Guga!",
      "Crio produtos com foco em simplicidade, praticidade e atenção aos detalhes.",
      "Hoje, eu trabalho no {UPM}, ajudando na criação do {SME}.",
      "Anteriormente, trabalhei na criação do {PAPELZINHO}, na {ORLA}. Também sou alumni da {ADA}.",
    ],
    sections: {
      design: "DESIGN",
      dev: "DEV",
      about: "SOBRE",
      cv: "CV",
    },
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
      "I'm Gustavo Galego, but everyone calls me Guga!",
      "I build products with a focus on simplicity, practicality and attention to detail.",
      "Today I work at {UPM}, helping to build {SME}.",
      "Previously, I worked on {PAPELZINHO} at {ORLA}. I'm also an alumnus of the {ADA}.",
    ],
    sections: {
      design: "DESIGN",
      dev: "DEV",
      about: "ABOUT",
      cv: "CV",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
