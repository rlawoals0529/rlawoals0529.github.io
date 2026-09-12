export type Project = {
  name: string;
  blurb: string;
  description: string;
  language: string | null;
  topics: string[];
  repo: string;
  demo: string | null;
  stars: number;
  rank: number;
};
