export interface ListItem {
  date: string;
  title: string;
  download: string;
  view: string;
}

export interface Entry {
  id: string;
  name: string;
  num: string;
}

export const DocType = {
  KOZLONY: 'magyar_kozlony',
  ERTESITO: 'hivatalos_ertesito',
} as const;
export type DocType = typeof DocType[keyof typeof DocType];
