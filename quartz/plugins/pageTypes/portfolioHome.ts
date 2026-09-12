import PortfolioHome from "../../components/PortfolioHome"
import { QuartzPageTypePlugin } from "../types"

export const PortfolioHomePage: QuartzPageTypePlugin = () => ({
  name: "PortfolioHomePage",
  priority: 100,
  match: ({ slug }) => slug === "index",
  layout: "portfolio-home",
  frame: "full-width",
  body: PortfolioHome,
})
