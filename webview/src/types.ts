// src/types.ts

export interface ArxivTask {
  id: string;
  title: string;
  origin: string; // URL to the original PDF
  zhCN: string; // URL to the translated PDF
  zhCNTar: string; // URL to the translated LaTeX source .tar.gz
  isDeepSeek: boolean;
}
