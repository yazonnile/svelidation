import { Writable } from 'svelte/store';

export enum ListenInputEventsEnum {
  never,
  always,
  afterValidation,
}

export type ListenInputEventsType = ListenInputEventsEnum.afterValidation | ListenInputEventsEnum.always | ListenInputEventsEnum.never;

export interface SvelidationEntryParams {
  type: string;
  optional?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  value?: string;
  trim?: boolean;
  equal?: number|string;
  match?: RegExp;
}

export enum SvelidationPresence {
  required = 'required',
  optional = 'optional'
}

export interface SvelidationOptions {
  validateOn?: string[];
  clearOn?: string[];
  listenInputEvents?: ListenInputEventsType;
  presence?: SvelidationPresence.required | SvelidationPresence.optional,
  trim?: boolean
}

export interface SvelidationFormElement {
  node: HTMLInputElement;
  options: SvelidationFormElementOptions;
  currentPhase: ListenInputEventsType;
  onClear(): void;
  onValidate(): void;
  setPhase(phase: ListenInputEventsType): void;
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
