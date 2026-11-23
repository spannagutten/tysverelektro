# Innhold og søkestatistikk

Nettsiden bruker nå HTML, CSS, JavaScript og bilder i public/. Tekst fra Sanity blir ikke hentet eller brukt på den offentlige nettsiden. Endringer publiseres via GitHub og Cloudflare som før.

Ved bygging lager scripts/build-search.mjs søkeindeksen fra HTML-filene. Søkeforslag, resultatsiden og registrering av søk bruker samme indeks.

Administrasjonssiden viser bare søkestatistikk. Sanity brukes fortsatt til sikker innlogging, mens tellingene ligger i Cloudflare D1. Eksisterende innhold i Sanity er beholdt som sikkerhetskopi, men påvirker ikke nettsiden. Endringer som bare finnes i Sanity blir ikke automatisk overført til HTML-filene.
