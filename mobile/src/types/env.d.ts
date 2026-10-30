/// <reference types="expo/types" />

/** React Native's FormData uploads a local file from a `{ uri, name, type }` descriptor. */
interface NativeFilePart {
  uri: string;
  name: string;
  type: string;
}

interface FormData {
  append(name: string, value: NativeFilePart): void;
}
