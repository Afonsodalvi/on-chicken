/**
 * Token Assets Helper
 * Carrega imagens e metadados dos tokens disponíveis
 */

// Importações dinâmicas das imagens
import chicken1 from "@/assets/1.png";
import chicken2 from "@/assets/2.png";
import chicken3 from "@/assets/3.png";
import chicken4 from "@/assets/4.png";
import chicken5 from "@/assets/5.png";
import chicken6 from "@/assets/6.png";
import chicken7 from "@/assets/7.png";
import chicken8 from "@/assets/8.png";
import chicken9 from "@/assets/9.png";
import chicken10 from "@/assets/10.png";

// Importações dos metadados
import metadata1 from "@/assets/metadados/1.json";
import metadata2 from "@/assets/metadados/2.json";
import metadata3 from "@/assets/metadados/3.json";
import metadata4 from "@/assets/metadados/4.json";
import metadata5 from "@/assets/metadados/5.json";
import metadata6 from "@/assets/metadados/6.json";
import metadata7 from "@/assets/metadados/7.json";
import metadata8 from "@/assets/metadados/8.json";
import metadata9 from "@/assets/metadados/9.json";
import metadata10 from "@/assets/metadados/10.json";

export interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  background_color: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface TokenAsset {
  tokenId: number;
  image: string;
  metadata: TokenMetadata;
}

// Mapeamento de imagens
const tokenImages: Record<number, string> = {
  1: chicken1,
  2: chicken2,
  3: chicken3,
  4: chicken4,
  5: chicken5,
  6: chicken6,
  7: chicken7,
  8: chicken8,
  9: chicken9,
  10: chicken10,
};

// Mapeamento de metadados
const tokenMetadata: Record<number, TokenMetadata> = {
  1: metadata1 as TokenMetadata,
  2: metadata2 as TokenMetadata,
  3: metadata3 as TokenMetadata,
  4: metadata4 as TokenMetadata,
  5: metadata5 as TokenMetadata,
  6: metadata6 as TokenMetadata,
  7: metadata7 as TokenMetadata,
  8: metadata8 as TokenMetadata,
  9: metadata9 as TokenMetadata,
  10: metadata10 as TokenMetadata,
};

/**
 * Obtém o asset completo de um token (imagem + metadados)
 */
export function getTokenAsset(tokenId: number): TokenAsset | null {
  const image = tokenImages[tokenId];
  const metadata = tokenMetadata[tokenId];

  if (!image || !metadata) {
    return null;
  }

  return {
    tokenId,
    image,
    metadata: {
      ...metadata,
      // Substituir a URL da imagem IPFS pela imagem local
      image: image,
    },
  };
}

/**
 * Obtém todos os tokens disponíveis (1-10)
 */
export function getAllTokenAssets(): TokenAsset[] {
  const tokens: TokenAsset[] = [];
  for (let i = 1; i <= 10; i++) {
    const asset = getTokenAsset(i);
    if (asset) {
      tokens.push(asset);
    }
  }
  return tokens;
}

/**
 * Obtém apenas a imagem de um token
 */
export function getTokenImage(tokenId: number): string | null {
  return tokenImages[tokenId] || null;
}

/**
 * Obtém apenas os metadados de um token
 */
export function getTokenMetadata(tokenId: number): TokenMetadata | null {
  return tokenMetadata[tokenId] || null;
}

