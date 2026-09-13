function setupPortfolioResume() {
  const printButton = document.querySelector<HTMLButtonElement>(".portfolio-print-resume")

  if (printButton && printButton.dataset.printBound !== "true") {
    printButton.dataset.printBound = "true"
    printButton.addEventListener("click", () => {
      window.requestAnimationFrame(() => window.print())
    })
  }
}

document.addEventListener("nav", setupPortfolioResume)
setupPortfolioResume()
