import { htmlToJsx } from "../util/jsx"
import { FilePath, FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Frontmatter = Record<string, unknown>
type Fact = { value: string; label: string }
type ApproachStep = { title: string; description: string }

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
}: {
  file: QuartzPluginData
  current: FullSlug
  featured?: boolean
}) {
  const fm = frontmatter(file)
  const href = resolveRelative(current, file.slug as FullSlug)
  const facts = records<Fact>(fm.facts)

  return (
    <article class={`portfolio-case${featured ? " portfolio-case-featured" : ""}`}>
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

const PortfolioHome: QuartzComponent = ({ fileData, allFiles, tree }: QuartzComponentProps) => {
  const fm = frontmatter(fileData)
  const current = fileData.slug ?? ("index" as FullSlug)
  const projects = projectFiles(allFiles)
  const [featuredProject, ...supportingProjects] = projects
  const decisions = decisionFiles(allFiles)
  const approach = records<ApproachStep>(fm.approach)
  const investigationProject = projects.find(
    (file) => text(frontmatter(file).focus) === "Investigate & improve",
  )
  const investigationHref = investigationProject?.slug
    ? resolveRelative(current, investigationProject.slug)
    : "#work"

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
        <a
          href={investigationHref}
          aria-label="Investigate and improve: read the investigation case"
        >
          <strong>
            Investigate &amp; improve <span aria-hidden="true">↓</span>
          </strong>
          <span>Production failures traced to root cause and contained</span>
        </a>
        <a href="#decisions" aria-label="Design and guide: go to Decision Records">
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

      <section id="decisions" class="portfolio-section">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">02 / Decision records</p>
            <h2>The reasoning behind the code.</h2>
          </div>
          <p>What was accepted, what it cost, and what evidence would make the decision change.</p>
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

      <section id="approach" class="portfolio-method">
        <div>
          <p class="portfolio-eyebrow">03 / How I work</p>
          <h2>
            Understand it.
            <br />
            Build it.
            <br />
            Own the outcome.
          </h2>
          <p>Good system design informs how I write, review, test, and operate code.</p>
        </div>
        <ol>
          {approach.map((step) => (
            <li>
              <div>
                <strong>{text(step.title)}</strong>
                <p>{text(step.description)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="about" class="portfolio-about portfolio-section">
        <p class="portfolio-eyebrow">04 / About &amp; collaboration</p>
        <div class="portfolio-authored">
          {htmlToJsx((fileData.filePath ?? "content/index.md") as FilePath, tree)}
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
