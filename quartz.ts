import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import PortfolioFooter from "./quartz/components/PortfolioFooter"
import PortfolioNav from "./quartz/components/PortfolioNav"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { PortfolioCaseStudyPage } from "./quartz/plugins/pageTypes/portfolioCaseStudy"
import { PortfolioCollectionPage } from "./quartz/plugins/pageTypes/portfolioCollection"
import { PortfolioHomePage } from "./quartz/plugins/pageTypes/portfolioHome"
import { PortfolioStaticPageType } from "./quartz/plugins/pageTypes/portfolioStatic"
import { PortfolioWritingPage } from "./quartz/plugins/pageTypes/portfolioWriting"

const config = await loadQuartzConfig()
config.plugins.pageTypes = [
  PortfolioHomePage(),
  PortfolioCollectionPage(),
  PortfolioStaticPageType(),
  PortfolioWritingPage(),
  PortfolioCaseStudyPage(),
  ...(config.plugins.pageTypes ?? []),
]

const portfolioNav = PortfolioNav()
const portfolioFooter = PortfolioFooter()

const portfolioLayout = {
  header: [portfolioNav],
  beforeBody: [],
  afterBody: [],
  left: [],
  right: [],
  footer: [portfolioFooter],
  frame: "full-width" as const,
}

export const layout = await loadQuartzLayout({
  byPageType: {
    "portfolio-home": {
      ...portfolioLayout,
    },
    "portfolio-collection": {
      ...portfolioLayout,
    },
    "portfolio-static": {
      ...portfolioLayout,
    },
    "portfolio-writing": {
      ...portfolioLayout,
    },
    "portfolio-case-study": {
      ...portfolioLayout,
    },
    content: {
      header: [portfolioNav],
      left: [],
      right: [],
      footer: [portfolioFooter],
      frame: "full-width",
    },
    folder: {
      header: [portfolioNav],
      left: [],
      right: [],
      footer: [portfolioFooter],
      frame: "full-width",
    },
    tag: {
      header: [portfolioNav],
      left: [],
      right: [],
      footer: [portfolioFooter],
      frame: "full-width",
    },
  },
})

const dispatcherIndex = config.plugins.emitters.findIndex(
  (emitter) => emitter.name === "PageTypeDispatcher",
)

if (dispatcherIndex >= 0) {
  config.plugins.emitters[dispatcherIndex] = PageTypeDispatcher(layout)
}

export default config
