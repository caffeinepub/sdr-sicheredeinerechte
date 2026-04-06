# SDR SichereDeineRechte

## Current State
Der Admin-Bereich zeigt drei Statistik-Karten und darunter Klappfelder.

## Requested Changes (Diff)

### Add
- Krypto-zu-Euro-Rechner direkt unter den Stats-Karten.
- Dropdown (BTC/ETH/ICP/XRP/SOL), Coin-Anzahl, Datum+Zeit-Picker, Euro-Ausgabefeld, Button.
- Live-Berechnung via CoinGecko historische Preise.

### Modify
- AdminPage.tsx: Rechner nach Stats-Karten einbauen.

### Remove
- Nichts.

## Implementation Plan
1. State fuer Currency, Betrag, Timestamp, Ergebnis, Loading, Error.
2. CoinGecko API: /coins/{id}/history?date=DD-MM-YYYY.
3. Live + Button Berechnung.
4. Passend zum deep-navy Theme.
