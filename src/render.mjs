import {searchLink} from './search-ui.mjs';
// HTML generated from published Sanity content. Never interpolate unescaped editor input.
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function safeLink(value, fallback = '#') {
  const s = String(value ?? '').trim();
  if (/[\\\u0000-\u0020]/.test(s)) return fallback;
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d ()-]+|\/(?!\/)[^\s]*|#[\w-]+)$/i.test(s) ? s : fallback;
}
export function imageUrl(image, fallback = '/images/guider/guider-og-tips.svg') {
  if(image?.localPath === '/images/guider/ip-grad.svg') return image.localPath;
  const url = image?.url;
  if (typeof url === 'string' && /^https:\/\/cdn\.sanity\.io\/images\/89cnbpsm\/production\/[\w.-]+$/.test(url)) return url + '?w=1200&fit=max&auto=format';
  const ref = image?.asset?._ref;
  const match = typeof ref === 'string' && ref.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/);
  return match ? `https://cdn.sanity.io/images/89cnbpsm/production/${match[1]}-${match[2]}.${match[3]}?w=1200&fit=max&auto=format` : fallback;
}
const picture = (doc, cls = '', fallback) => `<img class="${escapeHtml(cls)}" src="${escapeHtml(imageUrl(doc.image, fallback))}" alt="${escapeHtml(doc.image?.alt || '')}" loading="lazy" decoding="async">`;
export const slugOf = doc => /^[a-z0-9][a-z0-9.-]*$/.test(doc?.slug?.current || '') ? doc.slug.current : null;
const base = {guide:'/guider', service:'/tjenester', employee:'/om-oss', job:'/ledige-stillinger', page:'/sider'};
export const documentUrl = doc => slugOf(doc) && base[doc._type] ? `${base[doc._type]}/${slugOf(doc)}` : '#';
const plain = block => (block.children || []).map(child => child.text || '').join('');
export function portableText(blocks = []) {
  let html = '', list = '';
  const close = () => { if (list) html += `</${list}>`; list = ''; };
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (block._type === 'image') { close(); html += `<figure class="cms-figure">${picture({image: block})}${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}</figure>`; continue; }
    if (block._type !== 'block') continue;
    const wanted = block.listItem === 'bullet' ? 'ul' : block.listItem === 'number' ? 'ol' : '';
    if (wanted !== list) { close(); if (wanted) { list = wanted; html += `<${list}>`; } }
    const tag = wanted ? 'li' : ['h2','h3','h4','blockquote'].includes(block.style) ? block.style : 'p';
    const content = (block.children || []).map(span => {
      let text = escapeHtml(span.text).replace(/\n/g, '<br>');
      for (const mark of span.marks || []) {
        if (mark === 'strong') text = `<strong>${text}</strong>`;
        else if (mark === 'em') text = `<em>${text}</em>`;
        else { const def = (block.markDefs || []).find(d => d._key === mark); if (def?._type === 'link') text = `<a href="${escapeHtml(safeLink(def.href))}">${text}</a>`; }
      }
      return text;
    }).join('');
    html += `<${tag}>${content}</${tag}>`;
  }
  close(); return html;
}
export function groupContent(documents) {
  const docs = documents.filter(d => !d._id.startsWith('drafts.') && !d._id.startsWith('versions.') && !d.cmsMigrationTarget);
  const settings = {...(docs.find(d => d._type === 'siteSettings') || {})};
  // Keep the retired switchboard number out of the website, including older CMS settings.
  if (['52779239','4752779239'].includes(String(settings.phone || '').replace(/[^0-9]/g,''))) settings.phone = '934 97 622';
  return {docs, home: docs.find(d => d._type === 'home'), settings, employees: docs.filter(d => d._type === 'employee' && slugOf(d)), guides: docs.filter(d => d._type === 'guide' && slugOf(d)), services: docs.filter(d => d._type === 'service' && slugOf(d)), jobs: docs.filter(d => d._type === 'job' && slugOf(d)), pages: docs.filter(d => d._type === 'page' && slugOf(d))};
}
function contactLinks(person) {
  const links = [];
  if (person.phone) links.push(`<a href="${escapeHtml(safeLink('tel:' + (/^\d{8}$/.test(String(person.phone).replace(/\s/g,'')) ? '+47' : '') + String(person.phone).replace(/[^+\d]/g,'')))}">${escapeHtml(person.phone)}</a>`);
  if (person.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) links.push(`<a href="${escapeHtml(safeLink('mailto:' + person.email))}">${escapeHtml(person.email)}</a>`);
  return links.join('<span aria-hidden="true"> | </span>');
}
export function employeeCards(employees) {
  return employees.map(p => `<article class="team-card" aria-label="${escapeHtml(p.name)}"><a class="team-profile-link" href="${documentUrl(p)}" aria-label="Les om ${escapeHtml(p.name)}">${picture(p,'team-photo','/images/pfp.png')}</a><h3><a class="team-name-link" href="${documentUrl(p)}">${escapeHtml(p.name)}</a></h3><p class="team-role">${escapeHtml(p.role)}</p><div class="team-contact">${contactLinks(p)}</div></article>`).join('');
}
export function guideCards(guides, carousel = false) {
  return guides.map((g, index) => carousel ? `<a class="guide-slide" href="${documentUrl(g)}">${picture(g)}<h3>${escapeHtml(g.title)}</h3><span>Les guiden →</span></a>` : `<article class="guide-card">${picture(g,'guide-card-image')}<span class="guide-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h2><a href="${documentUrl(g)}">${escapeHtml(g.title)}</a></h2><p>${escapeHtml(g.intro)}</p><a class="button" href="${documentUrl(g)}">Les guiden<span class="visually-hidden">: ${escapeHtml(g.title)}</span></a></article>`).join('');
}
export function navigation(content) {
  const link = (label, url) => `<a href="${escapeHtml(safeLink(url))}">${escapeHtml(label)}</a>` + (url === "/kontakt" ? searchLink : "");
  const menu = (label, children, about = false) => `<details class="services-menu${about ? ' about-menu' : ''}"><summary>${escapeHtml(label)} <span class="services-chevron" aria-hidden="true">⌄</span></summary><div class="services-submenu">${children}</div></details>`;
  const serviceLinks = '<details class="services-group"><summary class="services-group-summary"><a class="services-overview-link" href="/tjenester">Alle tjenester</a><span class="services-group-arrow" aria-hidden="true">⌄</span></summary>' + '<ul class="services-group-list">' + content.services.map(d=>'<li>'+link(d.title,documentUrl(d))+'</li>').join('') + '</ul></details>' + '<div class="services-resource-links">'+link('Guider og tips','/guider')+link('Vanlige spørsmål','/vanlige-sporsmal')+'</div>';
  if (Array.isArray(content.settings.navigation) && content.settings.navigation.length) return content.settings.navigation.map(item => item.children?.some(i=>i.url==='/tjenester') ? menu('Tjenester',serviceLinks) : item.children?.length ? menu(item.title, item.children.map(i => link(i.title, i.url)).join('')) : link(item.url==='/kontakt'?'Kontakt':item.url==='/ledige-stillinger'?'Jobb hos oss':item.title, item.url)).join('');
  return link('Hjem','/') + menu('Tjenester',serviceLinks) + menu('Om oss',link('Om Tysvær Elektro','/om-oss') + link('Våre ansatte','/om-oss#ansatte') + link('Her finner du oss','/om-oss#hvor-vi-er'),true) + link('Jobb hos oss','/ledige-stillinger') + link('Kontakt','/kontakt') + (content.pages.length ? menu('Mer', content.pages.map(d=>link(d.title,documentUrl(d))).join('')) : '');
}
export function pageFor(pathname, content) {
  const path = pathname.replace(/\/index\.html$/, '').replace(/\/$/,'') || '/';
  if(path==='/vanlige-sporsmal') return {path,type:'static',template:path};
  for (const [type, prefix] of Object.entries(base)) {
    if (path.startsWith(prefix + '/')) {
      const slug = path.slice(prefix.length + 1);
      const doc = content.docs.find(d=>d._type===type && slugOf(d)===slug);
      if(doc?._localTemplate==='/guider/ip-grad') return {doc,path,type:'static',template:doc._localTemplate};
      return doc ? {doc, path, type, template: type==='employee' ? '/om-oss/erik.erland' : type==='guide' || type==='page' ? '/guider/sikringsskap' : type==='service' ? '/tjenester/elkontroll' : '/ledige-stillinger/elektriker'} : {notFound:true};
    }
  }
  if (path === '/tjenester') return {path, type:'services', template:path};
  if (path === '/guider') return {path, type:'guides', template:path};
  if (path === '/ledige-stillinger') return {path, type:'jobs', template:path};
  return {path, type:path==='/'?'home':path==='/om-oss'?'about':'static', template:path};
}

function guideTable(doc) {
  if(doc.hideComparisonTable) return '';
  const fallback = slugOf(doc)==='watt-lumen-lux' ? [{unit:'Watt (W)',meaning:'Effekt. For en lampe: den elektriske effekten den bruker.'},{unit:'Lumen (lm)',meaning:'Lysstrøm: mengden synlig lys en lyskilde sender ut.'},{unit:'Lux (lx)',meaning:'Belysningsstyrke: lysstrøm som treffer en flate, per kvadratmeter.'}] : [];
  const rows = doc.comparisonRows ?? fallback;
  if(!rows.length) return '';
  return '<div class="guide-table-wrap"><table class="guide-table"><caption>'+escapeHtml(doc.comparisonCaption||'Hva måler de ulike enhetene?')+'</caption><thead><tr><th scope="col">Enhet</th><th scope="col">Betydning</th></tr></thead><tbody>'+rows.map(row=>'<tr><th scope="row">'+escapeHtml(row.unit)+'</th><td>'+escapeHtml(row.meaning)+'</td></tr>').join('')+'</tbody></table></div>';
}

export function mainContent(page, content) {
  if(page.type === "search") return page.searchHtml;
  const d = page.doc;
  if (page.type === 'employee') return `<section class="section employee-section"><p><a class="employee-back" href="/om-oss#ansatte">← Tilbake til alle ansatte</a></p><div class="employee-profile">${picture(d,'employee-photo','/images/pfp.png')}<div class="employee-details"><h1>${escapeHtml(d.name)}</h1><p class="employee-role">${escapeHtml(d.role)}</p><div class="cms-rich-text">${portableText(d.bio)}</div><div class="employee-contact">${contactLinks(d)}</div></div></div></section>`;
  if (page.type === 'guides') return `<section class="section guides-overview"><h1>Guider og tips</h1><p class="guide-intro">Fakta om belysning, sikringsskap, elkontroll og elbillading.</p><div class="guide-grid">${guideCards(content.guides)}</div></section>`;
  if (page.type === 'guide' || page.type === 'page') return `<article class="section guide-page"><p><a class="employee-back" href="${page.type==='guide'?'/guider':'/'}">← ${page.type==='guide'?'Tilbake til guider':'Til forsiden'}</a></p><h1>${escapeHtml(d.title)}</h1><p class="guide-intro">${escapeHtml(d.intro)}</p>${picture(d,'guide-hero-image')}${page.type==='guide'?guideTable(d):''}<div class="cms-rich-text">${portableText(d.body)}</div>${page.type==='guide'?enquiry(content):''}</article>`;
  if (page.type === 'services') return `<section class="section"><h1>Våre tjenester</h1><p>Tysvær Elektro utfører elektriske installasjoner, service og vedlikehold for privat- og bedriftskunder.</p><h2 class="cms-services-heading">Noe av det vi gjør:</h2>${content.services.map((s,i)=>`<div class="service-row${i%2?' reverse':''}"><div class="service-image"><a class="service-image-link" href="${documentUrl(s)}">${picture(s)}</a></div><div class="service-text"><h3><a class="service-title-link" href="${documentUrl(s)}">${escapeHtml(s.title)}</a></h3><p>${escapeHtml(s.intro)}</p><a class="button service-more" href="${documentUrl(s)}">Les mer</a></div></div>`).join('')}</section>`;
  if (page.type === 'service') return `<section class="section service-detail"><p><a class="employee-back" href="/tjenester">← Tilbake til våre tjenester</a></p><h1>${escapeHtml(d.title)}</h1><p class="service-intro">${escapeHtml(d.intro)}</p><div class="service-detail-grid"><div class="service-detail-image">${picture(d)}</div><div class="service-detail-copy cms-rich-text">${portableText(d.body)}</div></div><div class="service-enquiry"><h2>Ta kontakt med oss</h2><p>Fortell oss hva du trenger hjelp med, så avtaler vi videre oppfølging.</p><a class="button" href="/kontakt">Kontakt oss</a></div></section>`;
  if (page.type === 'jobs') return `<section class="section careers-page"><h1>Ledige stillinger</h1><p class="careers-intro">Vil du bli en del av Tysvær Elektro? Se mulighetene hos oss.</p>${content.jobs.length ? content.jobs.map(j=>`<article class="job-card"><p class="job-location">Hele Haugalandet</p><h2><a href="${documentUrl(j)}">${escapeHtml(j.title)}</a></h2><p>${escapeHtml(j.intro)}</p><a class="button" href="${documentUrl(j)}">Les stillingsannonsen</a></article>`).join('') : '<p>Vi har ingen utlyste stillinger akkurat nå.</p>'}</section>`;
  if (page.type === 'job') {
    const cutoff = (d.body || []).findIndex(b=>b.style==='h2' && plain(b).trim()==='Slik søker du');
    const body = cutoff < 0 ? d.body : d.body.slice(0,cutoff);
    const person = d.contact || {name:'Øystein Trovåg', phone:'934 97 622', email:'oystein@tysverelektro.no'};
    const email = d.applicationEmail || person.email;
    return `<article class="section careers-page"><p><a class="employee-back" href="/ledige-stillinger">← Tilbake til ledige stillinger</a></p><h1>${escapeHtml(d.title)}</h1><p class="careers-intro">${escapeHtml(d.intro)}</p>${d.image?picture(d,'guide-hero-image'):''}<div class="cms-rich-text">${portableText(body)}</div><section class="job-apply" aria-labelledby="job-apply-heading"><h2 id="job-apply-heading">Slik søker du</h2><p>Send en kort søknad og CV til <a href="${escapeHtml(safeLink('mailto:'+email))}">${escapeHtml(email)}</a>.</p><a class="button" href="${escapeHtml(safeLink('mailto:'+email+'?subject='+encodeURIComponent(d.title)))}">Send søknad på e-post</a><p class="job-question">Har du spørsmål? Kontakt ${escapeHtml(person.name)}: ${contactLinks(person)}.</p><p class="job-note">Send bare opplysninger som er relevante for søknaden. Unngå fødselsnummer og sensitive personopplysninger.</p></section></article>`;
  }
  return null;
}
function enquiry(content) { const email = content.settings.email || 'post@tysverelektro.no';return `<div class="guide-enquiry"><h2>Spørsmål om ditt anlegg?</h2><p>Ta kontakt på <a href="${escapeHtml(safeLink('mailto:'+email))}">${escapeHtml(email)}</a> for en konkret vurdering.</p></div>`; }
export function createRewriter(page, content, Rewriter = HTMLRewriter) {
  const setHtml = html => ({element(element){element.setInnerContent(html,{html:true});}});
  const setText = text => ({element(element){element.setInnerContent(String(text ?? ''));}});
  const rw = new Rewriter().on('header nav',setHtml(navigation(content)));
  rw.on('body',{element(e){e.append('<script type="module" src="/search.js"></script>',{html:true});}});
  if(page.type==='search') rw.on('title',setText('Søk | Tysvær Elektro')).on('head',{element(e){e.append('<meta name="robots" content="noindex, follow">',{html:true});}});
  const body = mainContent(page,content);
  if (body !== null) rw.on('main',setHtml(body));
  if (page.doc) rw.on('title',setText(`${page.doc.title || page.doc.name} | Tysvær Elektro`));
  if (page.type === 'home' && content.home) {
    rw.on('.hero-content > h2',setText(content.home.title)).on('.hero-content > p',setText(content.home.intro));
    rw.on('.guide-carousel-track',setHtml(guideCards(content.guides,true)));
    if(content.home.guidesHeading) rw.on('#carousel-heading',setText(content.home.guidesHeading));
    if(content.home.careersHeading) rw.on('#home-careers-heading',setText(content.home.careersHeading));
    if(content.home.careersText) rw.on('.home-promo-careers p',setText(content.home.careersText));
  }
  if (page.type === 'about') {
    rw.on('.team-grid',setHtml(employeeCards(content.employees)));
    rw.on('main > .section > p:first-of-type',setHtml(escapeHtml(content.settings.aboutIntro ?? `Tysvær Elektro AS er din lokale elektriker.\nVi er ${content.employees.length} ansatte og har kontor i Skjoldastraumen.\nVi utfører elektriske installasjoner, service og vedlikehold for privatpersoner og bedrifter på Haugalandet.`).replace(/\n/g,'<br>')));
    if(content.settings.serviceArea) rw.on('#hvor-vi-er + p',setText(content.settings.serviceArea));
    if(content.settings.address) rw.on('.about-map > p:first-of-type',setHtml(`<strong>${escapeHtml(content.settings.companyName||'Tysvær Elektro AS')}</strong><br>${escapeHtml(content.settings.address).replace(/\n/g,'<br>')}`));
  }
  const settings = content.settings;
  if(page.path === '/kontakt') {
    if(settings.email) rw.on('main a[href^=\"mailto:post@\"]',{element(e){e.setAttribute('href',safeLink('mailto:'+settings.email));e.setInnerContent(settings.email);}});
    if(settings.phone) rw.on('main a[href^=\"tel:\"]',{element(e){e.setAttribute('href',safeLink('tel:'+settings.phone.replace(/[^+\d]/g,'')));e.setInnerContent(settings.phone);}});
  }
  rw.on('.footer-info',setHtml(`<p>© ${new Date().getUTCFullYear()} ${escapeHtml(settings.companyName||'Tysvær Elektro AS')}</p><p>Org.nr: ${escapeHtml(settings.orgNumber||'933 110 672')}</p><p>E-post: <a href="${escapeHtml(safeLink('mailto:'+(settings.email||'post@tysverelektro.no')))}">${escapeHtml(settings.email||'post@tysverelektro.no')}</a></p><p><a href="/personvern">Personvern</a></p>`));
  for(const [network,url] of [['facebook',settings.facebook],['instagram',settings.instagram]]) if(url) rw.on(`.social-links a[href*="${network}.com"]`,{element(e){e.setAttribute('href',safeLink(url));}});
  if(settings.email) rw.on('#kontakt a[href^="mailto:"]',{element(e){e.setAttribute('href',safeLink('mailto:'+settings.email));e.setInnerContent(settings.email);}});
  if(settings.phone) rw.on('#kontakt a[href^="tel:"]',{element(e){e.setAttribute('href',safeLink('tel:'+settings.phone.replace(/[^+\d]/g,'')));e.setInnerContent(settings.phone);}});
  rw.on('head',{element(e){e.append('<link rel="stylesheet" href="/cms.css"><link rel="stylesheet" href="/search.css">',{html:true});}});
  return rw;
}
