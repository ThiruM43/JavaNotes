declare module 'fuse.js' {
  namespace Fuse {
    interface IFuseOptions<T> {
      keys?: (string | { name: string; weight: number })[];
      threshold?: number;
      includeScore?: boolean;
      includeMatches?: boolean;
      minMatchCharLength?: number;
      ignoreLocation?: boolean;
      findAllMatches?: boolean;
      location?: number;
      distance?: number;
    }
    interface FuseResult<T> {
      item: T;
      score?: number;
      matches?: { key?: string; value?: string; indices: [number, number][] }[];
    }
  }
  class Fuse<T> {
    constructor(list: T[], options?: Fuse.IFuseOptions<T>);
    search(pattern: string): Fuse.FuseResult<T>[];
  }
  export = Fuse;
}
