---
name: pagamento-stripe
description: Integra pagamentos com Stripe (Payment Intents, Checkout, Elements). Use ao implementar checkout, assinaturas, pagamento com cartão ou quando o usuário mencionar Stripe, pagamentos ou cobrança.
---

# Pagamento com Stripe

## Como usar esta skill

- **Automático:** em conversas neste projeto, o agente pode aplicar esta skill quando você falar em Stripe, checkout, pagamento com cartão ou cobrança.
- **Explícito:** peça algo como “implementa o checkout seguindo a skill de pagamento Stripe” ou “usando a skill pagamento-stripe, como faço o webhook?”.
- **Referência:** você ou o agente podem abrir `.cursor/skills/pagamento-stripe/SKILL.md` para consultar os passos e exemplos.

Nenhuma configuração extra é necessária: skills em `.cursor/skills/` do repositório já ficam disponíveis no projeto.

## Escopo

- **Frontend (React)**: Stripe.js + React Stripe.js; nunca enviar dados de cartão ao seu backend.
- **Backend**: criar PaymentIntent ou Checkout Session; validar webhooks com assinatura.
- **Segurança**: chave pública só no frontend; chave secreta e webhook secret só no backend.

## Variáveis de ambiente

| Onde   | Nome                         | Uso                    |
|--------|------------------------------|------------------------|
| Cliente| `VITE_STRIPE_PUBLISHABLE_KEY`| Stripe.js / Elements   |
| Backend| `STRIPE_SECRET_KEY`          | SDK server-side        |
| Backend| `STRIPE_WEBHOOK_SECRET`      | Verificação de webhook |

Em projetos Vite, use `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY` no frontend.

## Fluxo recomendado (Payment Intents)

1. **Backend**: Receber valor e metadados → criar `PaymentIntent` com Stripe SDK → devolver `clientSecret`.
2. **Frontend**: Carregar Stripe com a publishable key → montar `<Elements>` com `clientSecret` → usar `<PaymentElement>` (ou CardElement) e `confirmPayment()`.
3. **Webhook**: Escutar `payment_intent.succeeded` (e falhas se precisar) → atualizar estado no seu sistema (ex.: Supabase); sempre verificar assinatura com `constructEvent(payload, signature, webhookSecret)`.

## Frontend (React + TypeScript)

Instalar: `@stripe/stripe-js` e `@stripe/react-stripe-js`.

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Na página de checkout
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <CheckoutForm clientSecret={clientSecret} />
</Elements>
```

Dentro do formulário: usar `useStripe()` e `useElements()`; ao submeter, chamar `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: '...' } })`. Tratar erros e estados (processing, succeeded, requires_action).

## Backend (Node/Edge)

- Usar `stripe.paymentIntents.create({ amount, currency: 'brl', automatic_payment_methods: { enabled: true }, metadata: { ... } })`.
- Para pagamento único redirecionável: `stripe.checkout.sessions.create()` com `mode: 'payment'` e `success_url` / `cancel_url`; frontend só redireciona para `session.url`.

## Webhooks

- Endpoint recebe POST com body bruto e header `Stripe-Signature`.
- Validar com `stripe.webhooks.constructEvent(body, signature, webhookSecret)`; em frameworks que parseiam JSON, usar o body raw (buffer/string).
- Responder 200 rapidamente; processar lógica assíncrona após responder.

## Boas práticas

- **Idempotência**: usar `idempotencyKey` em criações críticas (ex.: PaymentIntent) quando o cliente pode reenviar.
- **Valores**: enviar valor em centavos (ex.: R$ 10,00 → 1000); usar `currency: 'brl'` (ou a moeda do produto).
- **Metadados**: colocar `orderId`, `userId` etc. em `metadata` do PaymentIntent/Checkout Session para reconciliar no webhook.
- **Erros**: mapear `stripe.error` no frontend (cartão recusado, funds insufficient) e exibir mensagem amigável; não expor detalhes internos.

## Quando usar Checkout Session vs Payment Element

- **Checkout Session**: fluxo rápido, Stripe hospeda a página; redirecionar para `session.url` e depois para `success_url`/`cancel_url`.
- **Payment Element**: checkout customizado na sua UI (React); requer backend que cria PaymentIntent e devolve `clientSecret`.

## Referência rápida de erros comuns

- `card_declined`: orientar usuário a tentar outro cartão ou entrar em contato com o banco.
- `authentication_required`: 3D Secure; garantir que `confirmPayment` está sendo usado e que `return_url` leva de volta ao seu app.
- Webhook retorna 4xx/5xx: Stripe reenvia; garantir idempotência e resposta 200 após validação da assinatura.
