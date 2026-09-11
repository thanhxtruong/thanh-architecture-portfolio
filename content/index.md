---
title: "Thanh — Architecture Portfolio"
publish: true
---

<p class="eyebrow">Portfolio · Software architecture</p>

# Decisions, and the *roads not taken.*

A record of load-bearing decisions I've made and hard problems I've reasoned through in production systems — written to show **how I weigh tradeoffs**, not just what I shipped.

---

<div class="sec-head">
<p class="sec-kicker"><b>01</b> — Decision records</p>

## Decisions

<p class="sec-sub">The load-bearing choices — why each was made, and what was rejected.</p>
</div>

<div id="cards-decisions"></div>

---

<div class="sec-head">
<p class="sec-kicker"><b>02</b> — Case studies</p>

## Case studies

<p class="sec-sub">Not "here's a decision" but "here's a problem I reasoned through," end to end.</p>
</div>

<div id="cards-case-studies"></div>

---

<div class="sec-head">
<p class="sec-kicker"><b>03</b> — On practice</p>

## On practice

<p class="sec-sub">Teardowns of real systems and invented design problems.</p>
</div>

<div id="cards-practice"></div>

<script type="module">
const STATUS_CLASS = {
  accepted: "status-accepted",
  superseded: "status-superseded",
  deprecated: "status-deprecated",
  proposed: "status-proposed",
};

function renderCard(entry) {
  const slug = entry.slug;
  const fileName = slug.split("/").pop() + ".md";
  const a = document.createElement("a");
  a.className = "portfolio-card";
  a.setAttribute("href", slug);
  a.dataset.slug = slug;

  let metaHTML = "";
  if (entry.status) {
    const cls = STATUS_CLASS[entry.status] || "";
    const label = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
    metaHTML += `<span class="status-pill ${cls}"><span class="status-dot"></span>${label}</span><span class="sep">/</span>`;
  }
  if (entry.date) {
    metaHTML += `<span>${entry.date}</span><span class="sep">/</span>`;
  }
  metaHTML += `<span class="card-filename">${fileName}</span>`;

  a.innerHTML =
    `<div class="card-meta">${metaHTML}</div>` +
    `<div class="card-title">${entry.title}</div>` +
    (entry.description ? `<p class="card-desc">${entry.description}</p>` : "");
  return a;
}

async function populate() {
  const url = new URL("static/portfolioIndex.json", document.baseURI).href;
  let entries;
  try {
    const res = await fetch(url);
    entries = await res.json();
  } catch {
    return;
  }

  const buckets = { decisions: [], "case-studies": [], practice: [] };
  for (const e of entries) {
    if (buckets[e.folder]) buckets[e.folder].push(e);
  }

  for (const [folder, items] of Object.entries(buckets)) {
    const container = document.getElementById(`cards-${folder}`);
    if (!container) continue;
    container.innerHTML = "";
    for (const item of items) container.appendChild(renderCard(item));
  }
}

populate();
document.addEventListener("nav", () => populate());
</script>
