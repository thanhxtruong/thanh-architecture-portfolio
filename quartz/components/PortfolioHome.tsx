import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import {
  frontmatter,
  PortfolioCaseCard,
  PortfolioWritingCard,
  projectFiles,
  text,
  writingFiles,
} from "./PortfolioCards"

const PortfolioHome: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const projects = projectFiles(allFiles)
  const writing = writingFiles(allFiles)
  const casesHref = resolveRelative(current, "case-studies/index" as FullSlug)
  const writingHref = resolveRelative(current, "writing/index" as FullSlug)
  const aboutHref = resolveRelative(current, "about" as FullSlug)
  const contactHref = resolveRelative(current, "contact" as FullSlug)

  return (
    <article class="portfolio-home" id="main-content" tabIndex={-1}>
      <section class="portfolio-hero" aria-labelledby="portfolio-title">
        <div>
          <p class="portfolio-eyebrow">
            <span class="portfolio-dot" /> {text(fm.eyebrow)}
          </p>
          <h1 id="portfolio-title">
            {text(fm.headline, "Build it well.")}
            <br />
            <em>{text(fm.headline_accent, "See it through.")}</em>
          </h1>
          <p class="portfolio-intro">{text(fm.intro)}</p>
          <div class="portfolio-actions">
            <a class="internal portfolio-button" href={casesHref}>
              Explore my work <span aria-hidden="true">↗</span>
            </a>
            <a class="internal portfolio-text-link" href={writingHref}>
              Read my writing <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <aside class="portfolio-profile" aria-label="Professional profile">
          <p class="portfolio-eyebrow">The short version / 30 seconds</p>
          <h2>
            Deep in the code.
            <br />
            Mindful of the system.
          </h2>
          <p>{text(fm.profile_summary)}</p>
          <dl>
            <dt>Building</dt>
            <dd>{text(fm.profile_building)}</dd>
            <dt>Working in</dt>
            <dd>{text(fm.profile_working_in)}</dd>
            <dt>Exploring</dt>
            <dd>{text(fm.profile_exploring)}</dd>
          </dl>
          <div class="portfolio-profile-bottom">
            <a class="internal" href={aboutHref}>
              More about me →
            </a>
            <a class="internal" href={`${aboutHref}#resume`}>
              View résumé ↗
            </a>
          </div>
        </aside>
      </section>

      <section class="portfolio-section portfolio-home-cases">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">Selected case studies</p>
            <h2>
              Follow the problem
              <br />
              into the system.
            </h2>
          </div>
          <p>What I investigated, what I changed, and what the evidence actually supports.</p>
        </div>
        <div class="portfolio-card-grid">
          {projects.map((project) => (
            <PortfolioCaseCard file={project} current={current} />
          ))}
        </div>
        <div class="portfolio-section-tail">
          <a class="internal portfolio-text-link" href={casesHref}>
            All case studies →
          </a>
        </div>
      </section>

      <section class="portfolio-section">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">Selected writing</p>
            <h2>Software engineering, explained.</h2>
          </div>
          <p>Software engineering and architecture, explained through concrete problems.</p>
        </div>
        <div class="portfolio-writing-grid">
          {writing.map((article) => (
            <PortfolioWritingCard file={article} current={current} />
          ))}
        </div>
        <div class="portfolio-section-tail">
          <a class="internal portfolio-text-link" href={writingHref}>
            All writing →
          </a>
        </div>
      </section>

      <section class="portfolio-brand-panel" aria-labelledby="ai-heading">
        <div>
          <p class="portfolio-eyebrow">A project I'm developing</p>
          <h2 id="ai-heading">AI for the Curious</h2>
          <p>Practical AI education for software engineers.</p>
        </div>
        <div>
          <p class="portfolio-brand-promise">
            Use AI thoughtfully.
            <br />
            Evaluate its work.
            <br />
            Build systems you can depend on.
          </p>
          <a href="https://aiforthecurious.ai/" target="_blank" rel="noopener noreferrer">
            Explore AI for the Curious ↗
          </a>
          <small>Taking shape as I learn, build, and investigate.</small>
        </div>
      </section>

      <section class="portfolio-contact-strip">
        <div>
          <p class="portfolio-eyebrow">The next conversation</p>
          <h2>Have a problem worth solving?</h2>
          <p>A role, a project, or a question about something I've written—I'd like to hear it.</p>
        </div>
        <div class="portfolio-actions">
          <a class="internal portfolio-button" href={contactHref}>
            Get in touch ↗
          </a>
          <a class="internal portfolio-text-link" href={`${aboutHref}#resume`}>
            View résumé →
          </a>
        </div>
      </section>
    </article>
  )
}

export default (() => PortfolioHome) satisfies QuartzComponentConstructor
