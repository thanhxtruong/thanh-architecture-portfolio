---
title: "About"
publish: true
description: "How I approach substantial engineering work and the teams where I do my best work."
aliases:
  - resume
cssclasses:
  - portfolio-about-page
---

<div class="portfolio-about-layout" id="about">
  <section class="portfolio-about-copy" aria-labelledby="about-heading">
    <p class="portfolio-eyebrow">Experience &amp; collaboration</p>
    <h2 id="about-heading">I stay close to the work.</h2>
    <p>I enjoy ambiguous engineering problems that require careful investigation, a maintainable implementation, and thoughtful production follow-through.</p>
    <p>My work includes fullstack development, external-system integrations, persistence and concurrency, automated testing, technical reviews, and operational problem solving. Architectural judgment appears here as part of delivery: defining boundaries, surfacing hidden assumptions, weighing tradeoffs, and revising a decision when new evidence changes the calculation.</p>
    <p class="portfolio-best-fit"><strong>Best fit:</strong> a Senior Software Engineer role with ownership of substantial fullstack development and opportunities to improve both the system and the way the team reasons about it.</p>
    <figure class="portfolio-reference">
      <blockquote>“Build it well. See it through.”</blockquote>
      <figcaption>Working principle · Portfolio summary</figcaption>
    </figure>
  </section>

  <section class="portfolio-about-career" aria-label="Experience timeline">
    <div class="portfolio-timeline" aria-label="Experience timeline">
      <article class="portfolio-job">
        <time>Current</time>
        <div>
          <h3>Senior Software Engineer</h3>
          <span>Fullstack systems · production ownership</span>
          <p>Building across React, C#, APIs, and SQL Server; testing behavior at the boundaries that matter; and following changes through production support.</p>
        </div>
      </article>
    </div>
  </section>
</div>

<section class="portfolio-resume-section" id="resume" aria-labelledby="resume-heading">
  <header class="portfolio-resume-heading">
    <div>
      <p class="portfolio-eyebrow">Résumé</p>
      <h2 id="resume-heading">Senior Software Engineer</h2>
    </div>
    <button class="portfolio-print-resume" type="button">Print résumé / Save as PDF ↗</button>
  </header>
  <div class="portfolio-resume-content">
    <h3>Thanh Truong</h3>
    <p class="portfolio-resume-role">Senior Software Engineer</p>
    <h4>Profile</h4>
    <p>I build and operate fullstack systems, with particular attention to external integrations, persistence, concurrency, failure recovery, and the boundaries where otherwise reasonable components interact badly.</p>
    <h4>Technical practice</h4>
    <dl class="portfolio-resume-practice">
      <div><dt>Fullstack delivery</dt><dd>React, C#, SQL Server, APIs, and automated tests</dd></div>
      <div><dt>Production reliability</dt><dd>Failure analysis, recovery paths, observability, and operational follow-through</dd></div>
      <div><dt>Engineering judgment</dt><dd>Design reviews, explicit tradeoffs, decision records, and maintainable interfaces</dd></div>
    </dl>
    <h4>Selected engineering work</h4>
    <ul>
      <li><strong><a href="./work/reliable-erp-outbox">Building a reliable ERP delivery pipeline.</a></strong> Implemented the dispatcher and unit-of-work seam, shaped retry and client contracts, and added real-database concurrent-claim verification.</li>
      <li><strong><a href="./investigations/silent-failure-cascade">Following a silent failure four levels deep.</a></strong> Traced a cascading production failure and implemented timeout, recovery-scope, per-entry-scope, and batch-containment changes.</li>
      <li><strong><a href="./work/stale-writes-erp-sync">Controlling stale writes in an ERP-to-portal sync.</a></strong> Modeled competing interleavings, separated stale delivery from lost updates, and documented the controls and their boundaries.</li>
    </ul>
    <h4>What I’m looking for</h4>
    <p>A Senior Software Engineer opportunity with meaningful fullstack ownership, production responsibility, and room to contribute to system design.</p>
  </div>
</section>
