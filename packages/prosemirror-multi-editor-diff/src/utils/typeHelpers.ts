export const nonEmpty = <T>(element: T | null | undefined): element is T => {
  return element !== null && element !== undefined;
};

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];
