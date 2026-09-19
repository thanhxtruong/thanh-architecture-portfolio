function setupPortfolioResume() {
  const printButton = document.querySelector<HTMLButtonElement>(".portfolio-print-resume")

  if (printButton && printButton.dataset.printBound !== "true") {
    printButton.dataset.printBound = "true"
    printButton.addEventListener("click", () => {
      window.requestAnimationFrame(() => window.print())
    })
  }

  const menuButton = document.querySelector<HTMLButtonElement>(".portfolio-menu-toggle")
  const navigation = document.querySelector<HTMLElement>("#portfolio-main-nav")

  if (menuButton && navigation && menuButton.dataset.menuBound !== "true") {
    menuButton.dataset.menuBound = "true"
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true"
      menuButton.setAttribute("aria-expanded", String(open))
      navigation.classList.toggle("is-open", open)
    })

    navigation.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false")
      navigation.classList.remove("is-open")
    })
  }
}

document.addEventListener("nav", setupPortfolioResume)
setupPortfolioResume()
