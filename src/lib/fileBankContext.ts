import type { BankFile } from './types';

export type FileBankActions = {
  readonly clipboard: File | null;
  copy: (file: File) => void;
  destinations: () => { id: string; name: string }[];
  transfer: (destinationId: string, entry: BankFile) => boolean;
};

export let fileBankActions: FileBankActions;

export function setFileBankActions(actions: FileBankActions) {
  fileBankActions = actions;
}