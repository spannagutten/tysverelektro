# Administrasjon med Sanity

Nettsidens HTML/CSS og bilder er fortsatt i `public/`. Sanity inneholder innholdet.
Cloudflare Worker i `src/worker.mjs` kombinerer malene med **publisert** innhold.

## Redigere innhold

1. Åpne administrasjonspanelet og logg inn med kontoen som er medlem av prosjektet.
2. Velg Forsiden, Ansatte, Guider, Tjenester, Ledige stillinger eller Andre sider.
3. Rediger, og trykk Publish når endringen skal vises.
4. Endringen vises normalt innen omtrent ett minutt etter at denne kodeversjonen er publisert.

En ny ansatt oppretter både et ansattkort og en profilside. Nye guider, tjenester
og stillinger vises automatisk i oversiktene. Andre sider får adresse `/sider/<adresse>`
og legges i menyen Mer. En valgfri egendefinert meny kan settes under fellesinnstillingene.

`Adresse på nettsiden` bestemmer URL-en. Unngå å endre den etter at en side er delt;
det oppretter ikke automatisk videresending fra den gamle adressen.

## Brukertilgang

Foreløpig brukes eksisterende konto `erik3rland@gmail.com`. Ingen andre inviteres av koden.
Tilgangen håndheves av medlemskap og roller i Sanity, ikke av skjulte nettadresser.
Kontroller Members i både prosjektet og organisasjonen før løsningen tas i vanlig bruk.

Senere kan separate kontoer med e-post/passord inviteres. Kontroller den nye innloggingen
før gammel konto fjernes fra både prosjekt og organisasjon. På Free må alle som
skal skrive ha Administrator-rollen. Ikke legg sensitive kundeopplysninger i innholdsdatasettet.

## Lokalt

Installer med `pnpm install`. Kjør `pnpm --dir studio dev` for redigeringspanelet
og `pnpm dev` for hele nettsiden på port 8787.

- `pnpm test`: tester lenker, tekst, utkast, nye sider og kontaktopplysninger.
- `pnpm build`: bygger administrasjonen til `/admin` lokalt.
- `pnpm deploy`: bygger og publiserer Worker og statiske filer til Cloudflare.

Public-mappen kan fremdeles åpnes som statisk reserve, men CMS-endringer vises
bare når nettsiden kjøres gjennom Worker.

## Før første publisering

- Verifiser lokalt at alle relevante sider viser samme design og riktig innhold.
- Legg inn det eksakte produksjonsdomenet som CORS-origin med credentials i Sanity
  (API → CORS origins). Ingen jokertegn eller nye brukere trengs.
- Cloudflare Builds må installere prosjektets pnpm-workspace. Rootens lockfil styrer
  avhengighetene. Deploy-kommandoen kan være `pnpm deploy`; Wrangler kjører byggekommandoen.
- Publisering av kode er et eget steg. Disse filene publiserer ingenting av seg selv.

## Teknisk og sikkerhet

- Ingen Sanity-skrivetoken brukes på nettsiden eller i nettleserens offentlige kode.
- Sanity leses med `perspective=published`; utkast, versjoner og importkopier filtreres ut.
- Innhold mellomlagres i Cloudflare i 60 sekunder for lavere last og kostnad.
- HTML-tegn escapes, og lenkeprotokoller/bildeadresser valideres.
- Ved en Sanity-feil vises den eksisterende statiske siden som reserve der den finnes.
  Reserven kan derfor være eldre enn siste CMS-endring. Nye CMS-sider har ingen statisk reserve.
- Kontaktskjemaets pause og personvernutkastet er beholdt.
- Original wrangler-konfigurasjon er bevart lokalt under `cms-backup/`.
- `public/admin`, `.build`, `.wrangler` og node_modules er generert og skal ikke i Git.
- Den lokale engangsimporten finnes bare i utviklingspanelet. Importdata og importbilder
  kopieres ikke inn i produksjonspanelet.

## Første import

22 dokumenter ble importert fra eksisterende HTML. Gamle dokumenter med punktum i ID-en
ble beholdt som private importkopier merket `cmsMigrationTarget` og skjules i editorlistene.
De publiserte dokumentene bruker ID-er uten punktum. Nettsideadressene til ansatte beholder
punktum, for eksempel `/om-oss/erik.erland`.

## Administrasjonsdomene

Etter publisering åpner https://adm.te.erikerland.no redigeringspanelet på /admin.
I Sanity: API → CORS origins → legg til https://adm.te.erikerland.no med Allow credentials.
Wrangler beholder te.erikerland.no og legger til administrasjonsdomenet ved publisering.
Rootdomenet erikerland.no berøres ikke. Ingen brukere inviteres.
