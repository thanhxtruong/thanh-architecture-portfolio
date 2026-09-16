import { FullSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

type Frontmatter = Record<string, unknown>

const text = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback)

const number = (value: unknown, fallback = 99) =>
  typeof value === "number" ? value : Number(value ?? fallback)

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
        number(frontmatter(left).featured_order) - number(frontmatter(right).featured_order) ||
        text(frontmatter(right).date).localeCompare(text(frontmatter(left).date)),
    )

function ProjectCard({ file, current }: { file: QuartzPluginData; current: FullSlug }) {
  const fm = frontmatter(file)
  const href = resolveRelative(current, file.slug as FullSlug)

  return (
    <article class="portfolio-case">
      <div class="portfolio-case-summary">
        <div class="portfolio-case-copy">
          <div class="portfolio-tagline">
            <span class="portfolio-tag">
              {text(fm.case_theme, text(fm.project_status, "Case study"))}
            </span>
            <span>{text(fm.case_topics, text(fm.focus))}</span>
          </div>
          <h3>{titleFor(file)}</h3>
          <p>{text(fm.card_summary, text(fm.summary, text(fm.description)))}</p>
          {fm.inside_case || fm.my_contribution ? (
            <p class="portfolio-ownership">
              <strong>Inside the case:</strong> {text(fm.inside_case, text(fm.my_contribution))}
            </p>
          ) : null}
        </div>
      </div>
      <div class="portfolio-case-footer">
        <p>
          <strong>At stake:</strong> {text(fm.at_stake, text(fm.demonstrates, text(fm.focus)))}
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
  const [featuredProject, ...supportingProjects] = projects

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

      <section id="case-studies" class="portfolio-section portfolio-case-studies">
        <div class="portfolio-section-heading">
          <div>
            <p class="portfolio-eyebrow">01 / Case Studies</p>
            <h2>
              What the system actually does,
              <br />
              and what I decided about it.
            </h2>
          </div>
          <p>
            Each case starts with something I noticed, follows it into the system, and ends with a
            decision and its cost.
          </p>
        </div>
        {featuredProject ? <ProjectCard file={featuredProject} current={current} /> : null}
        <div class="portfolio-case-grid">
          {supportingProjects.map((project) => (
            <ProjectCard file={project} current={current} />
          ))}
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
