/**
 * Colecionáveis únicos (token IDs 11–18) – metadados via IPFS/Pinata
 *
 * Estratégia:
 *  - Base URL (folder IPFS) contém 11.json … 18.json;
 *  - Overrides on-chain: quando a URI de um token é atualizada no contrato para
 *    um CID próprio (ex.: 13 e 17), a URL final é resolvida aqui sem depender
 *    do folder antigo;
 *  - `fetchUniqueCollectibleMetadataOnChain` lê o tokenURI direto do contrato
 *    (ERC-1155 `uri`/`getTokenURI`) para captar qualquer atualização futura.
 */
import type { Address } from "viem";
import { getTokenURI } from "@/lib/contracts-helpers";

export const UNIQUE_COLLECTIBLES_TOKEN_IDS = [11, 12, 13, 14, 15, 16, 17, 18] as const;
export type UniqueCollectibleTokenId = (typeof UNIQUE_COLLECTIBLES_TOKEN_IDS)[number];

export const UNIQUE_COLLECTIBLES_METADATA_BASE_URL =
  import.meta.env.VITE_UNIQUE_COLLECTIBLES_METADATA_BASE_URL ||
  "https://yellow-concrete-pigeon-738.mypinata.cloud/ipfs/bafybeib5j44z4xjskecdsyoi547vp46jr6lkzjpjvpehg4znqbluu2y22m";

// Overrides: tokens cuja URI on-chain foi trocada para CIDs específicos
// (sem refazer upload do folder antigo).
export const UNIQUE_COLLECTIBLES_METADATA_OVERRIDES: Record<number, string> = {
  13: "https://lime-fancy-whale-116.mypinata.cloud/ipfs/bafkreia6qjxxehntkfrmsczzcwkyefncoav27mxs2u64jrwq5s3x6sfldm",
  17: "https://lime-fancy-whale-116.mypinata.cloud/ipfs/bafkreibgwvu52qttapbgansmmwcgau3powtdgecnd4ajppfcyj5bjd44tm",
};

const PRIMARY_IPFS_GATEWAY = "https://yellow-concrete-pigeon-738.mypinata.cloud/ipfs";

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

/** Converte `ipfs://CID/path` para URL HTTP usando o gateway primário. */
export function ipfsToHttp(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith("ipfs://")) {
    return `${PRIMARY_IPFS_GATEWAY}/${uri.slice("ipfs://".length)}`;
  }
  return uri;
}

/** URL padrão do metadado para um token (prefere override; senão base + id). */
export function getUniqueCollectibleMetadataUrl(tokenId: number): string {
  const override = UNIQUE_COLLECTIBLES_METADATA_OVERRIDES[tokenId];
  if (override) return override;
  return `${UNIQUE_COLLECTIBLES_METADATA_BASE_URL}/${tokenId}.json`;
}

/** Busca metadado a partir de uma URL (http/https/ipfs). */
export async function fetchUniqueCollectibleMetadataFromUrl(
  url: string
): Promise<UniqueCollectibleMetadata | null> {
  const httpUrl = ipfsToHttp(url);
  try {
    const res = await fetch(httpUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as UniqueCollectibleMetadata;
    return {
      ...data,
      image: ipfsToHttp(data?.image ?? ""),
    };
  } catch (e) {
    console.error("Error fetching unique collectible metadata from URL:", httpUrl, e);
    return null;
  }
}

/** Busca metadado usando URL hardcoded (override ou base + id). */
export async function fetchUniqueCollectibleMetadata(
  tokenId: number
): Promise<UniqueCollectibleMetadata | null> {
  return fetchUniqueCollectibleMetadataFromUrl(getUniqueCollectibleMetadataUrl(tokenId));
}

/**
 * Busca metadado lendo o tokenURI direto do contrato. Se a URI on-chain
 * não estiver disponível (ou o fetch falhar), cai para a URL hardcoded.
 * Use esta função sempre que quiser refletir alterações on-chain em tempo real.
 */
export async function fetchUniqueCollectibleMetadataOnChain(
  collectionAddress: Address,
  tokenId: number,
  publicClient: unknown
): Promise<UniqueCollectibleMetadata | null> {
  try {
    const uri = await getTokenURI(collectionAddress, BigInt(tokenId), publicClient);
    if (uri && uri.length > 0) {
      const metadata = await fetchUniqueCollectibleMetadataFromUrl(uri);
      if (metadata) return metadata;
    }
  } catch (e) {
    console.warn("On-chain tokenURI fetch failed for token", tokenId, e);
  }
  return fetchUniqueCollectibleMetadata(tokenId);
}
