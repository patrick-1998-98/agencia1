import { getEntry, type CollectionEntry } from 'astro:content';

type SectionData = CollectionEntry<'sections'>['data'];
export type Section<T extends SectionData['type']> = Extract<SectionData, { type: T }>;

/**
 * Loads a block from src/content/sections/<id>.yaml and checks its type,
 * so pages get fully typed data and a clear build error on mismatch.
 */
export async function getSection<T extends SectionData['type']>(
  id: string,
  type: T,
): Promise<Section<T>> {
  const entry = await getEntry('sections', id);
  if (!entry) throw new Error(`Section "${id}" not found in src/content/sections`);
  if (entry.data.type !== type) {
    throw new Error(`Section "${id}" is of type "${entry.data.type}", expected "${type}"`);
  }
  return entry.data as Section<T>;
}
