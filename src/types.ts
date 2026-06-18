export type Team = {
  id: string;       // stable id, equals iso2 except gb-eng / gb-sct
  de: string;       // German display name
  code: string;     // FIFA trigramme, e.g. "GER"
  iso2: string;     // ISO2 reference, e.g. "de"
  flagFile: string; // relative path, e.g. "assets/flags/de.png"
};

export type Placed = { teamId: string; x: number; y: number }; // x,y = token center in stage px

export type BoardState = { placed: Placed[] };
