import { Writable } from 'svelte/store';

export enum SvelidationPhase {
  never,
  always,
  afterValidation,
}

export type SvelidationPhaseType = SvelidationPhase.afterValidation | SvelidationPhase.always | SvelidationPhase.never;

export interface SvelidationEntryParams {
  type: string;
  optional?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  value?: string;
  trim?: boolean;
  equal?: number|string;
  match?: RegExp;
}

export interface SvelidationOptions {
  validateOn?: string[];
  clearOn?: string[];
  listenInputEvents?: SvelidationPhaseType;
  presence?: 'required' | 'optional',
  trim?: boolean
}

export interface SvelidationFormElement {
  node: HTMLInputElement;
  options: SvelidationFormElementOptions;
  currentPhase: SvelidationPhaseType;
  onClear(): void;
  onValidate(): void;
  setPhase(phase: SvelidationPhaseType): void;
  preventEvents(): boolean;
  destroy(): void;
}

export interface SvelidationFormElementOptions extends SvelidationOptions {
  onClear: () => void;
  onValidate: () => void;
}

export interface SvelidationStoreObject {
  value: any;
  errors: any[];
}

export type SvelidationStoreType = Writable<SvelidationStoreObject>;

export interface SvelidationEntry {
  store: SvelidationStoreType;
  params: SvelidationEntryParams;
  formElements?: SvelidationFormElement[];
}

export interface SvelidationUseFunctionReturn {
  destroy(): void;
}

export interface SvelidationUseInputFunction {
  (node: HTMLInputElement, params?: SvelidationEntryParams): SvelidationUseFunctionReturn;
}

interface SvelidationCreateEntriesObject {
  [key: string]: SvelidationEntryParams;
}

export type SvelidationCreateEntriesData = SvelidationEntryParams[] | SvelidationCreateEntriesObject;

export interface SvelidationFormEvents {
  onSubmit?(e: Event, errors: any[]): void;
  onFail?(errors: any[]): void;
  onSuccess?(): void;
}
