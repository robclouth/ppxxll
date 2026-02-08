
export type Parameter = {
  name: string;
  type: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  value: number;
};

export type InputType = "camera" | "captured";

export type InputOutput = {
  id?: string;
  type: InputType;
};

export type Pass = {
  code: string;
  inputs: InputOutput[];
  outputs: InputOutput[];
  parameters: { [name: string]: Parameter };
};

export type Shader = {
  id: string;
  title: string;
  description: string;
  author: string;
  passes: Pass[];
  thumbnailUrl?: string;
};