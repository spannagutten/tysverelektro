# Sanity – Tysvær Elektro

Prosjekt: `89cnbpsm`, datasett: `production`.

Dette er administrasjonspanelet. Den eksisterende nettsiden i `public/` er beholdt.
Oppsettet er ikke ferdig før innhold er importert, nettsiden leser publisert innhold,
og administrasjonspanelet er publisert og testet.

## Lokalt

Installer Node.js 22.12 eller nyere og en pakkebehandler (pnpm/npm).
I `studio/`: installer avhengigheter og kjør `sanity dev` via pakkebehandleren.
Logg inn med samme metode som da Sanity-kontoen ble opprettet.
Ikke legg passord, API-tokens eller innloggingsfiler i Git.

## Innhold

- Forsiden: hovedoverskrift, innledning, guideoverskrift og rekruttering.
- Ansatte: navn, stilling, telefon, e-post, profilbilde og presentasjon.
- Guider, tjenester og stillingsannonser: overskrift, adresse, innledning, bilde og tekst.
- Andre sider: innhold til nye sider med samme design.
- Felles kontaktinformasjon og innledning om firmaet.

Sanitys innlogging beskytter lagring og publisering. Ingen skrivetoken skal finnes
på den offentlige nettsiden. Utkast skal aldri leses av den offentlige nettsiden.

## Gjenstående tilkobling

1. Fullfør innlogging i CLI.
2. Kontroller at datasettet er riktig og tomt før første import.
3. Importer eksisterende innhold uten å overskrive eventuelle endringer i Sanity.
4. Koble nettsidens maler til det publiserte innholdet og test lokalt.
5. Publiser Studio og konfigurer tillatte CORS-adresser.
6. Test tekst, bilde og ny side før produksjonspublisering.

Vanlig innholdsredigering skal ikke kreve Git. Design- og kodeendringer følger Git.
