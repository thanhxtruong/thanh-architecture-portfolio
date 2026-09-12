import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import PortfolioNav from "./quartz/components/PortfolioNav"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { PortfolioHomePage } from "./quartz/plugins/pageTypes/portfolioHome"

const config = await loadQuartzConfig()
config.plugins.pageTypes = [PortfolioHomePage(), ...(config.plugins.pageTypes ?? [])]

const portfolioNav = PortfolioNav()

export const layout = await loadQuartzLayout({
  byPageType: {
    "portfolio-home": {
      header: [portfolioNav],
      beforeBody: [],
      afterBody: [],
      left: [],
      right: [],
      frame: "full-width",
    },
    content: {
      header: [portfolioNav],
      left: [],
      right: [],
      frame: "full-width",
    },
    folder: {
      header: [portfolioNav],
      left: [],
      right: [],
      frame: "full-width",
    },
    tag: {
      header: [portfolioNav],
      left: [],
      right: [],
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
