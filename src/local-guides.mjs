const guides = [
  {
    "_id": "guide-ip-grad",
    "_type": "guide",
    "title": "Hva betyr IP-grad?",
    "slug": {
      "current": "ip-grad"
    },
    "intro": "Hva betyr IP44, IP65 og IP67? Lær hvordan merkingen beskriver beskyttelse mot faste gjenstander, støv og vann.",
    "image": {
      "localPath": "/images/guider/ip-grad.svg",
      "alt": "IP44 med forklaring av de to tallene"
    },
    "body": [
      {
        "_type": "block",
        "children": [
          {
            "_type": "span",
            "text": "Hva betyr IP44, IP65 og IP67? Lær hvordan merkingen beskriver beskyttelse mot faste gjenstander, støv og vann. 0 Ingen angitt beskyttelse mot faste gjenstander. 1 Gjenstander med diameter 50 mm eller større. 2 Gjenstander med diameter 12,5 mm eller større, for eksempel en finger. 3 Gjenstander med diameter 2,5 mm eller større. 4 Gjenstander med diameter 1 mm eller større. 5 Støvbeskyttet: støv skal ikke trenge inn i skadelige mengder. 6 Støvtett. 0 Ingen angitt vannbeskyttelse. 1 Loddrett fallende vanndråper. 2 Vanndråper når kapslingen heller opptil 15 grader. 3 Vannsprut opptil 60 grader fra loddrett. 4 Vannsprut fra alle retninger. 5 Vannstråler fra alle retninger. 6 Kraftige vannstråler fra alle retninger. 7 Midlertidig nedsenking i vann under bestemte testvilkår. 8 Vedvarende nedsenking under vilkår angitt for produktet. Sjekk dybde og varighet. 9 Vannstråler med høyt trykk og høy temperatur under bestemte testvilkår. IP20 Beskyttet mot gjenstander på 12,5 mm eller større. Ingen angitt vannbeskyttelse. IP44 Beskyttet mot gjenstander på 1 mm eller større og vannsprut fra alle retninger. IP54 Støvbeskyttet og beskyttet mot vannsprut fra alle retninger. IP65 Støvtett og beskyttet mot vannstråler. IP66 Støvtett og beskyttet mot kraftige vannstråler. IP67 Støvtett og beskyttet ved midlertidig nedsenking under bestemte testvilkår. IP68 Støvtett og beskyttet ved vedvarende nedsenking etter produktets angitte vilkår."
          }
        ]
      }
    ],
    "_localTemplate": "/guider/ip-grad"
  }
];
export function withLocalGuides(documents){
 const active=documents.filter(d=>!d.cmsMigrationTarget&&!d._id.startsWith('drafts.')&&!d._id.startsWith('versions.'));
 return [...documents,...guides.filter(g=>!active.some(d=>d._type==='guide'&&d.slug?.current===g.slug.current))];
}
