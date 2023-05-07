export type TileContentProcessor = (
  type: string | undefined,
  content: Buffer
) => Promise<Buffer>;
