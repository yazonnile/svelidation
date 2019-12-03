import { Writable } from 'svelte/store';

export enum SvelidationPhaseEnum {
  never,
  always,
  afterFirstValidation,
}

export type SvelidationPhaseEnumType = SvelidationPhaseEnum.afterFirstValidation | SvelidationPhaseEnum.always | SvelidationPhaseEnum.never;

export interface SvelidationEntryParamsInterface {
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

export interface SvelidationOptionsInterface {
  validateOn?: string[];
  clearOn?: string[];
  inputValidationPhase?: SvelidationPhaseEnumType;
  presence: 'required' | 'optional',
  trim?: boolean
}

export interface SvelidationInputInterface {
  node: HTMLInputElement;
  options: SvelidationInputOptionsInterface;
  currentPhase: SvelidationPhaseEnumType;
  onClear(): void;
  onValidate(): void;
  setPhase(phase: SvelidationPhaseEnumType): void;
  preventEvents(): boolean;
  destroy(): void;
}

export interface SvelidationInputOptionsInterface extends SvelidationOptionsInterface {
  onClear: () => void;
  onValidate: () => void;
}

export interface SvelidationStoreObjectInterface {
  value: any;
  errors: any[];
}

export type SvelidationStoreType = Writable<SvelidationStoreObjectInterface>;

export interface SvelidationEntryInterface {
  store: SvelidationStoreType;
  params: SvelidationEntryParamsInterface;
  input?: SvelidationInputInterface;
}

export interface SvelidationUseFunctionReturn {
  destroy(): void;
}

export interface SvelidationUseInputFunctionInterface {
  (node: HTMLInputElement, params?: SvelidationEntryParamsInterface): SvelidationUseFunctionReturn;
}

interface SvelidationCreateEntriesObject {
  [key: string]: SvelidationEntryParamsInterface;
}

export type SvelidationCreateEntriesDataInterface = SvelidationEntryParamsInterface[] | SvelidationCreateEntriesObject;

export interface SvelidationFormEventsInterface {
  onSubmit?(e: Event, errors: any[]): void;
  onFail?(errors: any[]): void;
  onSuccess?(): void;
}
