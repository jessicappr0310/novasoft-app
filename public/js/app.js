(function () {
  // Mobile menu: simple toggle that reveals nav links + WhatsApp CTA stacked
  const burger = document.getElementById('navBurger');
  const nav = document.querySelector('.nav');

  if (burger) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('nav-open');
    });
  }

  // Close mobile menu after clicking a link
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', () => nav.classList.remove('nav-open'));
  });

  // Scroll reveal for sections
  const revealTargets = document.querySelectorAll(
    '.rubro-card, .incluye-copy, .incluye-visual, .price-card, .final-cta'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => observer.observe(el));
})();
