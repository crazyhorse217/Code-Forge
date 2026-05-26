/* ── Nav scroll shadow ────────────────────────────────────────────────────── */
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20)
}, { passive: true })

/* ── Scroll-reveal ────────────────────────────────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal')

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      observer.unobserve(entry.target)
    }
  })
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

revealEls.forEach((el) => observer.observe(el))

/* ── Stagger children on reveal ───────────────────────────────────────────── */
document.querySelectorAll('.features-grid, .template-grid, .steps').forEach((grid) => {
  const children = grid.children
  Array.from(children).forEach((child, i) => {
    child.classList.add('reveal')
    child.style.transitionDelay = `${i * 0.07}s`
    observer.observe(child)
  })
})

/* ── Smooth active-link highlight ─────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]')
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]')

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.id
      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`)
      })
    }
  })
}, { threshold: 0.4 })

sections.forEach((s) => sectionObserver.observe(s))

/* ── Download button pulse after 3 s ─────────────────────────────────────── */
setTimeout(() => {
  const dlBtn = document.querySelector('.dl-card .btn-primary')
  if (dlBtn) {
    dlBtn.style.animation = 'pulse-cta 1.4s ease-in-out 3'
  }
}, 3000)
