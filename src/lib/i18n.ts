export type Locale = "pt" | "en";

export const dictionaries = {
  pt: {
    languageToggle: "EN",
    themeToggleToDark: "DARK",
    themeToggleToLight: "LIGHT",
    welcome: "Bem-vindo",
    intro: [
      "Me chamo Gustavo Galego, mas todo mundo me chama de Guga!",
      "Crio produtos com foco em simplicidade, praticidade e atenção aos detalhes.",
      "Hoje, eu trabalho na {UPM}, ajudando na criação do {SME}.",
      "Anteriormente, trabalhei na criação do Papelzinho, na Orla. Também sou alumni da Apple Developer Academy.",
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
    welcome: "Welcome",
    intro: [
      "I'm Gustavo Galego, but everyone calls me Guga!",
      "I build products with a focus on simplicity, practicality and attention to detail.",
      "Today I work at {UPM}, helping to build {SME}.",
      "Previously, I worked on Papelzinho at Orla. I'm also an alumnus of the Apple Developer Academy.",
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
