export type WordStructureComponent = {
  text?: string;
  type?: string;
  function?: string;
};

export type WordStructure = {
  summary?: string;
  components?: WordStructureComponent[];
};

export type Collocation = {
  korean: string;
  chinese: string;
};

export type ExampleSentence = {
  korean: string;
  chinese: string;
};

export type WordDetail = {
  word: string;
  baseForm?: string;
  pronunciation?: string | null;
  meanings: string[];
  yx?: string | null;
  posPrimary?: string | null;
  posSecondary?: string | null;
  summary?: string;
  wordStructure?: WordStructure | null;
  collocations: Collocation[];
  examples: ExampleSentence[];
  source: string;
};

export type ApiWordResponse = WordDetail;

export type DefinitionState =
  | { status: "idle"; data: null; message?: undefined }
  | { status: "loading"; data: null; message?: undefined }
  | { status: "error"; data: null; message?: string }
  | { status: "ready"; data: WordDetail; message?: undefined };
