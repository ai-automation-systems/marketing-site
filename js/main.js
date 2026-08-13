// Подстановка настроек из config.js
document.querySelectorAll("[data-brand]").forEach(el => {
  el.textContent = SITE_CONFIG.brandName;
});
document.querySelectorAll("[data-tg]").forEach(el => {
  el.href = SITE_CONFIG.telegramUrl;
  el.target = "_blank";
  el.rel = "noopener";
});
document.querySelectorAll("[data-year]").forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Мобильное меню
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");
const setMenu = open => {
  document.body.classList.toggle("nav-open", open);
  burger.setAttribute("aria-expanded", String(open));
};
burger.addEventListener("click", () =>
  setMenu(!document.body.classList.contains("nav-open"))
);
nav.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => setMenu(false))
);

// Плавное появление секций
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("in-view");
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll(".block, .final").forEach(el => observer.observe(el));
