# Referência das ABIs - Contratos PudgyChicken

Este documento descreve as principais funções dos contratos para facilitar a implementação.

## 📋 Índice
- [ChickenManagerFarm](#chickenmanagerfarm)
- [PudgyChicken Collection](#pudgychicken-collection)
- [Endereços de Testnet (Base Sepolia)](#endereços-de-testnet-base-sepolia)

---

## 🏭 ChickenManagerFarm

Contrato responsável por gerenciar e fazer deploy de novas coleções PudgyChicken.

### Funções Principais

#### `getPudgyChicken(uint256 id) → address`
Obtém o endereço de uma coleção pelo ID.
- **Parâmetros**: `id` - ID da coleção (0 para primeira coleção)
- **Retorno**: Endereço do contrato da coleção

#### `getPudgyChickenByContract(address collection) → uint256`
Obtém o ID de uma coleção pelo endereço do contrato.
- **Parâmetros**: `collection` - Endereço do contrato
- **Retorno**: ID da coleção

#### `createMatchById(uint256 id, address player, uint256 tokenId, uint8 battleType, uint256 betAmount, uint8 paymentType) → uint256`
Cria uma nova batalha/match.
- **Parâmetros**:
  - `id` - ID da coleção
  - `player` - Endereço do jogador
  - `tokenId` - ID do token NFT
  - `battleType` - Tipo de batalha (enum)
  - `betAmount` - Valor da aposta
  - `paymentType` - Tipo de pagamento (0=ETH, 1=USDC, 2=USDT, 3=EggCoin)
- **Retorno**: ID do match criado
- **StateMutability**: `payable`

#### `joinMatchById(uint256 matchId, uint256 id, uint256 tokenId)`
Entra em um match existente.
- **Parâmetros**:
  - `matchId` - ID do match
  - `id` - ID da coleção
  - `tokenId` - ID do token NFT
- **StateMutability**: `payable`

#### `deployPDC(address adminPudgyChicken, string baseURI, address eggCoin, bytes32 salt) → address`
Faz deploy de uma nova coleção PudgyChicken (sem pagamento).
- **Parâmetros**:
  - `adminPudgyChicken` - Endereço do admin
  - `baseURI` - URI base para metadados
  - `eggCoin` - Endereço do contrato EggCoin
  - `salt` - Salt para determinismo
- **Retorno**: Endereço da nova coleção

#### `deployPDCPaying(address adminPudgyChicken, string baseURI, address eggCoin, bytes32 salt, uint8 paymentType) → address`
Faz deploy de uma nova coleção com pagamento.
- **Parâmetros**: Mesmos de `deployPDC` + `paymentType`
- **StateMutability**: `payable`

#### `getDeploymentPriceETH() → uint256`
Obtém o preço de deployment em ETH.

#### `getDeploymentPriceUSDC() → uint256`
Obtém o preço de deployment em USDC.

---

## 🐔 PudgyChicken Collection

Contrato ERC-1155 que representa uma coleção de NFTs PudgyChicken.

### Funções de Leitura (View)

#### `balanceOf(address account, uint256 id) → uint256`
Obtém o balance de um token específico para um endereço.

#### `balanceOfBatch(address[] accounts, uint256[] ids) → uint256[]`
Obtém o balance de múltiplos tokens para múltiplos endereços.

#### `getTokenSkills(uint256 tokenId) → tuple`
Obtém as skills de um token.
- **Retorno**: `{power, speed, health, clucking, broodPower}`

#### `getTokenStatus(uint256 tokenId) → tuple`
Obtém o status de um token.
- **Retorno**: `{battleWins, isIncubating}`

#### `getPrice(uint256 tokenId, uint256 typePayment) → uint256`
Obtém o preço de um token para um tipo de pagamento específico.

#### `getTokenURI(uint256 tokenId) → string`
Obtém a URI do token (metadados).

#### `uri(uint256 tokenId) → string`
Obtém a URI do token (padrão ERC-1155).

#### `getRarityTier(uint256 tokenId) → uint256`
Obtém a tier de raridade do token (0-4).

#### `getSupply(uint256 tokenId) → uint256`
Obtém o supply atual do token.

#### `getMaxSupply(uint256 tokenId) → uint256`
Obtém o max supply do token.

#### `isWhitelisted(address account) → bool`
Verifica se um endereço está na whitelist.

#### `isTokenAlive(uint256 tokenId) → bool`
Verifica se o token está vivo (não expirou).

#### `isTokenEligibleForFreeMint(uint256 tokenId) → bool`
Verifica se o token é elegível para free mint.

#### `getRemainingFreeMints(address account) → uint256`
Obtém os free mints restantes para um endereço.

#### `getFreeMintsUsed(address account) → uint256`
Obtém quantos free mints já foram usados.

#### `isPaymentTypeEnabled(uint256 typePayment) → bool`
Verifica se um tipo de pagamento está habilitado.

#### `getTokenMintTimestamp(uint256 tokenId) → uint256`
Obtém o timestamp de quando o token foi mintado.

#### `getTokenExpirationTimestamp(uint256 tokenId) → uint256`
Obtém o timestamp de expiração do token.

#### `getTokenRemainingLifespan(uint256 tokenId) → uint256`
Obtém o tempo restante de vida do token.

#### `getTokenLifespanPercentage(uint256 tokenId) → uint256`
Obtém a porcentagem de vida restante do token.

#### `isCycleFinalized(uint256 tokenId) → bool`
Verifica se o ciclo do token foi finalizado.

### Funções de Escrita (Write)

#### `mint(address to, uint256 tokenId, uint256 quantity, uint256 typePayment)`
Minta tokens com pagamento.
- **StateMutability**: `payable`
- **Parâmetros**:
  - `to` - Endereço que receberá os tokens
  - `tokenId` - ID do token
  - `quantity` - Quantidade a mintar
  - `typePayment` - Tipo de pagamento (0=ETH, 1=USDC, 2=USDT, 3=EggCoin)

#### `mintFree(address to, uint256 tokenId, uint256 quantity)`
Minta tokens gratuitamente (requer whitelist e elegibilidade).
- **Parâmetros**:
  - `to` - Endereço que receberá os tokens
  - `tokenId` - ID do token
  - `quantity` - Quantidade a mintar

#### `finalizeCycle(uint256 tokenId)`
Finaliza o ciclo de vida de um token (quando expira).

#### `regenerateSkills(uint256 tokenId)`
Regenera as skills de um token.

#### `setApprovalForAll(address operator, bool approved)`
Aprova um operador para gerenciar todos os tokens.

#### `safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)`
Transfere tokens (padrão ERC-1155).

### Funções Admin (apenas para roles específicos)

#### `addToWhitelist(address account)`
Adiciona um endereço à whitelist.

#### `removeFromWhitelist(address account)`
Remove um endereço da whitelist.

#### `addMultipleToWhitelist(address[] accounts)`
Adiciona múltiplos endereços à whitelist.

#### `removeMultipleFromWhitelist(address[] accounts)`
Remove múltiplos endereços da whitelist.

#### `updateBattleWins(uint256 tokenId, uint256 newBattleWins)`
Atualiza o número de vitórias de um token.

#### `updateIncubationStatus(uint256 tokenId, bool isIncubating)`
Atualiza o status de incubação de um token.

---

## 🌐 Endereços de Testnet (Base Sepolia)

```
EggCoin: 0x278d559F74d86aae1FB577FD4Bd748Ec624E534b
ChickenManagerFarm: 0x7D002d08acf9c2E0992F39A56340318Dd35a292D
PudgyChicken Implementation: 0x98D3083dB2D45283Fd776C9a8847cC6F5aD3C65b
PudgyChickenFight: 0x1daa259C2eFe42D635aDD6a03Cf1B53EB5655c79
First Collection (PudgyChicken): 0x5776cBdDB00e68E183E32D8534A27699196d05A7
```

**Chain ID**: 84532 (Base Sepolia)

---

## 📝 Notas Importantes

1. **Payment Types**:
   - `0` = ETH (native)
   - `1` = USDC
   - `2` = USDT
   - `3` = EggCoin

2. **Token Lifecycle**:
   - Tokens têm um ciclo de vida limitado
   - Use `isTokenAlive()` para verificar se está vivo
   - Use `finalizeCycle()` quando o token expirar

3. **Whitelist**:
   - Free mints requerem whitelist
   - Verifique `isWhitelisted()` antes de tentar free mint
   - Verifique `getRemainingFreeMints()` para ver quantos restam

4. **Skills**:
   - Cada token tem 5 skills: power, speed, health, clucking, broodPower
   - Skills podem ser regeneradas com `regenerateSkills()`

5. **Battle System**:
   - Use `createMatchById()` no Manager para criar batalhas
   - Use `joinMatchById()` para entrar em batalhas existentes
   - Status de batalhas é atualizado via `updateBattleWins()`

