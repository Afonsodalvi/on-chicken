/**
 * Colecionáveis únicos (token IDs 11–18) – metadados via IPFS/Pinata
 */

export const UNIQUE_COLLECTIBLES_TOKEN_IDS = [11, 12, 13, 14, 15, 16, 17, 18] as const;
export type UniqueCollectibleTokenId = (typeof UNIQUE_COLLECTIBLES_TOKEN_IDS)[number];

export const UNIQUE_COLLECTIBLES_METADATA_BASE_URL =
  import.meta.env.VITE_UNIQUE_COLLECTIBLES_METADATA_BASE_URL ||
  "https://yellow-concrete-pigeon-738.mypinata.cloud/ipfs/bafybeib5j44z4xjskecdsyoi547vp46jr6lkzjpjvpehg4znqbluu2y22m";

export interface UniqueCollectibleAttribute {
  trait_type: string;
  value: string;
}

export interface UniqueCollectibleMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: UniqueCollectibleAttribute[];
}

export function getUniqueCollectibleMetadataUrl(tokenId: number): string {
  return `${UNIQUE_COLLECTIBLES_METADATA_BASE_URL}/${tokenId}.json`;
}

export async function fetchUniqueCollectibleMetadata(
  tokenId: number
): Promise<UniqueCollectibleMetadata | null> {
  const url = getUniqueCollectibleMetadataUrl(tokenId);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data as UniqueCollectibleMetadata;
  } catch (e) {
    console.error("Error fetching unique collectible metadata:", e);
    return null;
  }
}
