# SDR SichereDeineRechte

## Current State

The app has a landing page, auth page (/auth), welcome page (/welcome), FAQ page (/fragen), dashboard (/app), and admin page (/admin). Users register/login with nickname + password. After login they go to /welcome, then to /app via the red button. The dashboard currently shows placeholder cards (Wissensbasis, Fallanalyse, Community) with no real content.

## Requested Changes (Diff)

### Add
- Crypto payment flow in the dashboard: a prominent "Musterschreiben kaufen" button
- Payment page (/zahlung) showing accepted crypto wallet addresses (BTC, ETH, XMR) with required amount
- After payment, user submits transaction hash for verification
- Backend stores payment requests and verifies BTC/ETH transactions via HTTP outcalls to public blockchain APIs
- Backend function to mark user as having paid (musterschreibenAccess flag per nickname)
- Musterschreiben page (/musterschreiben) accessible only after confirmed payment - shows actual template documents
- Admin page: list of pending payment requests with manual approve/reject option

### Modify
- Dashboard: replace placeholder cards with real "Musterschreiben kaufen" section and status indicator
- Backend: add payment management functions, stable storage for payments and access flags
- App.tsx: add /zahlung and /musterschreiben routes

### Remove
- Nothing removed

## Implementation Plan

1. Select http-outcalls component
2. Update backend main.mo:
   - Add stable storage: paymentRequests map, musterschreibenAccess map, cryptoAddresses config
   - Functions: submitPaymentProof(nickname, txHash, currency), checkPaymentStatus(nickname), verifyBTCPayment(txHash, address), verifyETHPayment(txHash, address) via HTTP outcalls, grantAccess(nickname) for admin, hasMusterschreibenAccess(nickname)
3. Generate new Motoko code
4. Update frontend:
   - Dashboard.tsx: add "Musterschreiben kaufen" button linking to /zahlung, and "Musterschreiben öffnen" if already paid
   - New ZahlungPage.tsx: show BTC/ETH/XMR addresses, required amount, TX hash input form, verification status
   - New MusterschreibenPage.tsx: accessible only with confirmed payment, shows template documents
   - AdminPage.tsx: add pending payments list with approve/reject buttons
   - App.tsx: add routes for /zahlung and /musterschreiben
