# SDR SichereDeineRechte

## Current State
- ZahlungPage ("Musterschreiben freischalten") zeigt ein Formular mit Kryptowährungsauswahl und TX-ID-Eingabe, aber keinen automatisch befüllten Nickname.
- AdminPage zeigt Zahlungsbestätigungen direkt sichtbar (nicht hinter einem Button), neueste zuletzt (aufsteigend sortiert).
- TX-ID im Admin-Bereich hat keinen Kopierbutton.

## Requested Changes (Diff)

### Add
- Auf der ZahlungPage: Über dem TX-ID-Feld ein schreibgeschütztes Feld mit Label "Ihr Nickname", das automatisch mit dem eingeloggten Nickname befüllt ist.
- Im AdminPage: Alle Zahlungseingänge hinter einem Toggle-Button "Zahlungseingänge" verstecken.
- Im AdminPage: Hinter jeder TX-ID einen Kopierbutton.
- Im AdminPage: Hinter dem Kopierbutton jeweils einen Button "Musterschreiben freischalten" (entspricht dem bestehenden grantMusterschreibenAccess).

### Modify
- AdminPage: Zahlungseingänge sortieren von neu nach alt (neueste oben) – aktuell ist es aufsteigend (älteste oben).
- AdminPage: Die Zahlungsbestätigungen sind nicht mehr direkt sichtbar, sondern klappen sich beim Klick auf "Zahlungseingänge" auf/zu.

### Remove
- Nichts entfernen.

## Implementation Plan
1. ZahlungPage: Readonly-Eingabefeld "Ihr Nickname" über dem TX-ID-Feld einfügen, Wert aus `nickname` state.
2. AdminPage: State für `showPayments` (boolean) hinzufügen; Zahlungseingänge-Sektion hinter Button "Zahlungseingänge" verstecken.
3. AdminPage: Sortierung von `sortedPaymentRequests` umkehren (neueste zuerst: absteigende submittedAt-Sortierung).
4. AdminPage: In jeder Zahlungszeile hinter der TX-ID einen Copy-Button einfügen.
5. AdminPage: Den bestehenden "Musterschreiben freischalten"-Button direkt neben dem Copy-Button platzieren (statt in einem separaten Button-Container).
