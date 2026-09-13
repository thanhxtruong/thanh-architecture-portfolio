import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Frontmatter = Record<string, unknown>
type Fact = { value: string; label: string }

const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback)

const number = (value: unknown, fallback = 99) =>
  typeof value === "number" ? value : Number(value ?? fallback)

const records = <T extends Record<string, unknown>>(value: unknown): T[] =>
  Array.isArray(value)
    ? value.filter((item): item is T => typeof item === "object" && item !== null)
    : []

const frontmatter = (file: QuartzPluginData): Frontmatter =>
  (file.frontmatter as Frontmatter | undefined) ?? {}

const titleFor = (file: QuartzPluginData) => text(frontmatter(file).title, "Untitled")

const isInFolder = (file: QuartzPluginData, folder: string) =>
  file.slug === `${folder}/index` || file.slug?.startsWith(`${folder}/`)

const projectFiles = (allFiles: QuartzPluginData[]) =>
  allFiles
    .filter((file) => {
      const fm = frontmatter(file)
      return fm.type === "project" && fm.featured === true && file.slug
    })
    .sort(
      (left, right) =>
        number(frontmatter(left).featured_order) - number(frontmatter(right).featured_order),
    )

const decisionFiles = (allFiles: QuartzPluginData[]) =>
  allFiles
    .filter((file) => {
      const fm = frontmatter(file)
      return fm.type === "decision" && file.slug && !file.slug.endsWith("/index")
    })
    .sort((left, right) =>
      text(frontmatter(right).date).localeCompare(text(frontmatter(left).date)),
    )
    .slice(0, 5)

function Facts({ items }: { items: Fact[] }) {
  if (items.length === 0) return null

  return (
    <div class="portfolio-case-facts">
      {items.slice(0, 3).map((fact) => (
        <div>
          <strong>{text(fact.value)}</strong>
          <span>{text(fact.label)}</span>
        </div>
      ))}
    </div>
  )
}

function FeaturedDiagram() {
  return (
    <div class="portfolio-diagram" role="img" aria-label="ERP delivery and recovery boundaries">
      <p class="portfolio-eyebrow">The critical boundary / external side effect</p>
      <div class="portfolio-diagram-flow">
        <div>
          <span>01</span>
          <strong>Outbox dispatcher</strong>
          <small>owns retry state</small>
        </div>
        <b aria-hidden="true">→</b>
        <div class="is-accented">
          <span>02</span>
          <strong>External ERP</strong>
          <small>irreversible side effect</small>
        </div>
        <b aria-hidden="true">→</b>
        <div>
          <span>03</span>
          <strong>Local persistence</strong>
          <small>must recover independently</small>
        </div>
      </div>
      <p class="portfolio-diagram-caption">
        A successful external write and a successful local save are separate outcomes.
      </p>
    </div>
  )
}

function ProjectCard({
  file,
  current,
  featured = false,
  wide = false,
}: {
  file: QuartzPluginData
  current: FullSlug
  featured?: boolean
  wide?: boolean
}) {
  const fm = frontmatter(file)
  const href = resolveRelative(current, file.slug as FullSlug)
  const facts = records<Fact>(fm.facts)

  return (
    <article
      class={`portfolio-case${featured ? " portfolio-case-featured" : ""}${wide ? " portfolio-case-wide" : ""}`}
    >
      <div class="portfolio-case-summary">
        <div class="portfolio-case-copy">
          <div class="portfolio-tagline">
            <span class="portfolio-tag">{text(fm.project_status, "Case study")}</span>
            <span>{text(fm.period, text(fm.date))}</span>
            <span>{text(fm.focus)}</span>
          </div>
          <h3>{titleFor(file)}</h3>
          <p>{text(fm.summary, text(fm.description))}</p>
          {fm.my_contribution ? (
            <p class="portfolio-ownership">
              <strong>My contribution:</strong> {text(fm.my_contribution)}
            </p>
          ) : null}
          <Facts items={facts} />
        </div>
        {featured ? <FeaturedDiagram /> : null}
      </div>
      <div class="portfolio-case-footer">
        <p>
          <strong>Demonstrates:</strong> {text(fm.demonstrates, text(fm.focus))}
        </p>
        <a class="internal" href={href}>
          Read the case study <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}

const PortfolioHome: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const projects = projectFiles(allFiles)
  const investigationProjects = projects.filter((file) => isInFolder(file, "investigations"))
  const selectedProjects = projects.filter((file) => isInFolder(file, "work"))
  const [featuredProject, ...supportingProjects] = selectedProjects
  const decisions = decisionFiles(allFiles)

  return (
    <article class="portfolio-home" id="top">
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
        </div>
        <aside class="portfolio-profile" aria-label="Professional profile">
          <p class="portfolio-eyebrow">The short version / 30 seconds</p>
          <h2>{text(fm.profile_title)}</h2>
          <p>{text(fm.profile_summary)}</p>
          <dl>
            <dt>Focus</dt>
            <dd>{text(fm.profile_focus)}</dd>
            <dt>Practice</dt>
            <dd>{text(fm.profile_practice)}</dd>
            <dt>Evidence</dt>
            <dd>{text(fm.profile_evidence)}</dd>
          </dl>
          <p class="portfolio-status">Open to Senior Software Engineer opportunities</p>
        </aside>
      </section>

      <nav class="portfolio-credibility" aria-label="Explore portfolio sections">
        <a href="#work" aria-label="Build and deliver: go to What I Shipped">
          <strong>
            Build &amp; deliver <span aria-hidden="true">↓</span>
          </strong>
          <span>Features built, tested against real dependencies, and shipped</span>
        </a>
        <a href="#investigations" aria-label="Investigate and improve: go to System Investigations">
          <strong>
            Investigate &amp; improve <span aria-hidden="true">↓</span>
          </strong>
          <span>Production failures traced to root cause and contained</span>
        </a>
        <a href="#decisions" aria-label="Design and guide: go to Decisions">
          <strong>
            Design &amp; guide <span aria-hidden="true">↓</span>
          </strong>
          <span>Options compared, costs named, decisions documented</span>
        </a>
      </nav>

      <section id="work" class="portfolio-section">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">01 / What I shipped</p>
            <h2>Problems solved, start to finish</h2>
          </div>
          <p>What I built, how I tested it, and the tradeoffs.</p>
        </div>
        {featuredProject ? <ProjectCard file={featuredProject} current={current} featured /> : null}
        <div class="portfolio-case-grid">
          {supportingProjects.map((project) => (
            <ProjectCard file={project} current={current} />
          ))}
        </div>
      </section>

      <section id="investigations" class="portfolio-section">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">02 / System investigations</p>
            <h2>Failures traced through the system.</h2>
          </div>
          <p>The symptom, the path through the system, and the root cause.</p>
        </div>
        <div class="portfolio-investigation-list">
          {investigationProjects.map((project) => (
            <ProjectCard file={project} current={current} wide />
          ))}
        </div>
      </section>

      <section id="decisions" class="portfolio-section">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">03 / Decisions</p>
            <h2>The reasoning behind the code.</h2>
          </div>
          <p>What was accepted, what it cost, and the assumptions that hold it.</p>
        </div>
        <div class="portfolio-decision-list">
          {decisions.map((file, index) => {
            const decision = frontmatter(file)
            return (
              <details class="portfolio-decision">
                <summary>
                  <span class="portfolio-decision-id">
                    {text(decision.decision_id, `ADR-${String(index + 1).padStart(2, "0")}`)}
                  </span>
                  <span class="portfolio-decision-title">{titleFor(file)}</span>
                  <span class="portfolio-decision-state">
                    {text(decision.status, "Recorded")} · {text(decision.date)}
                  </span>
                </summary>
                <div>
                  <p>{text(decision.description)}</p>
                  <a class="internal" href={resolveRelative(current, file.slug as FullSlug)}>
                    Read the full decision <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </details>
            )
          })}
        </div>
      </section>

      <section class="portfolio-contact" id="contact">
        <div>
          <p class="portfolio-eyebrow">The next conversation</p>
          <h2>{text(fm.contact_title, "What does your team need to build next?")}</h2>
          <p>{text(fm.contact_summary)}</p>
        </div>
        <div>
          <p class="portfolio-eyebrow">Start with the problem</p>
          <a href={text(fm.contact_url, "https://github.com/thanhxtruong")}>
            {text(fm.contact_label, "github.com/thanhxtruong")} ↗
          </a>
          <p>Share the role, the team, and the engineering challenge.</p>
        </div>
      </section>
    </article>
  )
}

export default (() => PortfolioHome) satisfies QuartzComponentConstructor
