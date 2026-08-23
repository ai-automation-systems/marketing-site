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

// Кейсы: раскрытие карточки. Открыт всегда только один —
// иначе секция растягивается на пять экранов и теряется.
document.querySelectorAll(".work").forEach(work => {
  const head = work.querySelector(".work__head");
  const more = work.querySelector(".work__more");
  if (!head) return;

  head.addEventListener("click", () => {
    const open = !work.classList.contains("is-open");

    document.querySelectorAll(".work.is-open").forEach(other => {
      if (other === work) return;
      other.classList.remove("is-open");
      const h = other.querySelector(".work__head");
      const m = other.querySelector(".work__more");
      if (h) h.setAttribute("aria-expanded", "false");
      if (m) m.textContent = m.dataset.open;
    });

    work.classList.toggle("is-open", open);
    head.setAttribute("aria-expanded", String(open));
    if (more) more.textContent = open ? more.dataset.close : more.dataset.open;

    // свёрнутая панель убирается из порядка табуляции целиком:
    // иначе клавиатура попадает на невидимую кнопку «смотреть видео»
    document.querySelectorAll(".work").forEach(w => {
      const panel = w.querySelector(".work__panel");
      if (panel) panel.toggleAttribute("inert", !w.classList.contains("is-open"));
    });
  });
});

// Видео в кейсе: файл не грузится, пока не нажали play (preload="none").
// При сворачивании карточки — ставим на паузу, иначе звук играет из ниоткуда.
document.querySelectorAll(".work__video").forEach(box => {
  const video = box.querySelector(".work__v");
  const play = box.querySelector(".work__play");
  if (!video || !play) return;

  play.addEventListener("click", () => {
    video.controls = true;
    box.classList.add("is-playing");
    video.play();
  });
  video.addEventListener("pause", () => {
    if (video.currentTime === 0) box.classList.remove("is-playing");
  });
});

document.querySelectorAll(".work").forEach(work => {
  const head = work.querySelector(".work__head");
  if (!head) return;
  head.addEventListener("click", () => {
    // после переключения класс уже проставлен обработчиком выше
    document.querySelectorAll(".work:not(.is-open) .work__v").forEach(v => {
      if (!v.paused) v.pause();
    });
  });
});

// Карта в первом экране: стрелка-компас смотрит на курсор,
// ближайший к её направлению город подсвечивается и показывает расстояние.
(() => {
  const map = document.querySelector(".hero__map");
  if (!map) return;

  const needle = map.querySelector(".map__needle");
  const readCity = map.querySelector(".map__read-city");
  const readKm = map.querySelector(".map__read-km");
  const vx = parseFloat(map.dataset.vx);
  const vy = parseFloat(map.dataset.vy);
  const size = parseFloat(map.dataset.size) || 480;

  const cities = [...map.querySelectorAll(".map__city")].map(el => {
    const x = parseFloat(el.dataset.x) - vx;
    const y = parseFloat(el.dataset.y) - vy;
    return { el, name: el.dataset.city, km: el.dataset.km,
             angle: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360 };
  });

  const aim = (clientX, clientY) => {
    const box = map.getBoundingClientRect();
    // курсор в координатах viewBox
    const px = (clientX - box.left) / box.width * size;
    const py = (clientY - box.top) / box.height * size;
    const dx = px - vx;
    const dy = py - vy;
    if (Math.hypot(dx, dy) < 6) return;

    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    needle.style.transform = `rotate(${angle}deg)`;

    // ближайший по направлению город
    let best = null, bestDiff = 999;
    cities.forEach(c => {
      // угловое расстояние между направлением стрелки и городом, 0…180
      const diff = Math.abs(((c.angle - angle + 540) % 360) - 180);
      if (diff < bestDiff) { bestDiff = diff; best = c; }
    });

    cities.forEach(c => c.el.classList.toggle("is-near", c === best && bestDiff < 26));
    if (best && bestDiff < 26) {
      readCity.textContent = best.name;
      readKm.textContent = best.km + " км";
    } else {
      readCity.textContent = "Мы здесь";
      readKm.textContent = "";
    }
  };

  // Считаем напрямую: семь городов — это несколько операций,
  // троттлить тут нечего, а лишнее звено способно залипнуть.
  window.addEventListener("pointermove", e => aim(e.clientX, e.clientY), { passive: true });
})();
