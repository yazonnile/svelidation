import { Writable } from "svelte/store";

export enum PhaseEnum {
  never,
  always,
  afterFirstValidation,
}

export type PhaseEnumType = PhaseEnum.afterFirstValidation | PhaseEnum.always | PhaseEnum.never;

export type ErrorsType = string[];

export interface EntryParamsInterface {
  type: string;
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  value?: string;
  trim?: boolean;
  equal?: number|string;
  match?: RegExp;
}

export interface OptionsInterface {
  validateOn?: string[];
  clearOn?: string[];
  inputValidationPhase?: PhaseEnumType;
}

export interface InputInterface {
  node: HTMLInputElement;
  options: InputOptionsInterface;
  currentPhase: PhaseEnumType;
  onClear(): void;
  onValidate(): void;
  setPhase(phase: PhaseEnumType): void;
  preventEvents(): boolean;
  destroy(): void;
}

export interface InputOptionsInterface extends OptionsInterface {
  onClear: () => void;
  onValidate: () => void;
}

export interface StoreObjectInterface {
  value: any;
  errors: ErrorsType;
}

export type StoreType = Writable<StoreObjectInterface>;

export interface EntryInterface {
  store: StoreType;
  params: EntryParamsInterface;
  input?: InputInterface;
}

export interface UseFunctionReturn {
  destroy(): void;
}

export interface UseInputFunctionInterface {
  (node: HTMLInputElement, params?: EntryParamsInterface): UseFunctionReturn;
}

interface CreateEntriesObject {
  [key: string]: EntryParamsInterface;
}

export type CreateEntriesDataInterface = EntryParamsInterface[] | CreateEntriesObject;

export interface FormEventsInterface {
  onSubmit?(e: Event, errors: ErrorsType[]): void;
  onFail?(errors: ErrorsType[]): void;
  onSuccess?(): void;
}
