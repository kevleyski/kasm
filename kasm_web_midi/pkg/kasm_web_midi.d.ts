/* tslint:disable */
/* eslint-disable */
export class ChordNote {
  free(): void;
  constructor(note_offset: number, velocity_percent: number, probability_percent: number);
  note_offset: number;
  velocity_percent: number;
  probability_percent: number;
}
export class ChordProcessor {
  free(): void;
  constructor();
  set_chord_note(index: number, note_offset: number, velocity_percent: number, probability_percent: number): void;
  process_note_on(note: number, velocity: number): Array<any>;
  process_note_off(note: number): Array<any>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_chordprocessor_free: (a: number, b: number) => void;
  readonly __wbg_chordnote_free: (a: number, b: number) => void;
  readonly __wbg_get_chordnote_note_offset: (a: number) => number;
  readonly __wbg_set_chordnote_note_offset: (a: number, b: number) => void;
  readonly __wbg_get_chordnote_velocity_percent: (a: number) => number;
  readonly __wbg_set_chordnote_velocity_percent: (a: number, b: number) => void;
  readonly __wbg_get_chordnote_probability_percent: (a: number) => number;
  readonly __wbg_set_chordnote_probability_percent: (a: number, b: number) => void;
  readonly chordnote_new: (a: number, b: number, c: number) => number;
  readonly chordprocessor_new: () => number;
  readonly chordprocessor_set_chord_note: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly chordprocessor_process_note_on: (a: number, b: number, c: number) => any;
  readonly chordprocessor_process_note_off: (a: number, b: number) => any;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
