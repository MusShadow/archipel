// Petit routeur : les écrans s'inscrivent ici au démarrage, ce qui évite les imports circulaires.
export const nav = {
  start: (): void => { throw new Error("écran d'accueil non inscrit"); },
  map: (): void => { throw new Error("carte non inscrite"); },
  parent: (_tab?: string): void => { throw new Error("espace parent non inscrit"); },
  setup: (): void => { throw new Error("premier lancement non inscrit"); },
};
