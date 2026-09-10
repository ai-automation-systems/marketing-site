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
  burger?.setAttribute("aria-expanded", String(open));
  burger?.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
};
burger?.addEventListener("click", () =>
  setMenu(!document.body.classList.contains("nav-open"))
);
nav?.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => setMenu(false))
);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
    setMenu(false);
    burger?.focus();
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest(".header")) setMenu(false);
});

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

// Анимации этапов включаются только в видимой области страницы.
const approachMotion = new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle("is-animating", entry.isIntersecting));
}, { threshold: 0.2 });
document.querySelectorAll("#approach .step, #approach .after__card").forEach(card => approachMotion.observe(card));

// Ленту партнёров можно остановить кнопкой, в том числе с клавиатуры.
const partners = document.querySelector(".partners");
const partnersPause = partners?.querySelector(".partners__pause");
partnersPause?.addEventListener("click", () => {
  const paused = partners.classList.toggle("is-paused");
  partnersPause.setAttribute("aria-pressed", String(paused));
  partnersPause.setAttribute("aria-label", paused ? "Продолжить ленту партнёров" : "Приостановить ленту партнёров");
});

// Кейсы: плитка открывает окно с подробностями.
// Нативный <dialog> сам ловит фокус, закрывается по Escape
// и не даёт странице за собой прокручиваться.
document.querySelectorAll(".work__tile").forEach(tile => {
  const modal = document.getElementById(tile.dataset.modal);
  if (!modal) return;

  tile.addEventListener("click", () => modal.showModal());

  const close = modal.querySelector(".work__close");
  if (close) close.addEventListener("click", () => modal.close());

  // клик по затемнению — тоже закрытие
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.close();
  });

  // окно закрылось: останавливаем видео и возвращаем фокус на плитку.
  // Фокус ставим следующим тактом: браузер восстанавливает свой уже
  // после этого события и иначе перебьёт наш вызов.
  modal.addEventListener("close", () => {
    if (location.hash === "#" + modal.id) history.replaceState(null, "", location.pathname + location.search);
    modal.querySelectorAll("video").forEach(v => { if (!v.paused) v.pause(); });
    setTimeout(() => tile.focus(), 0);
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
    if (!box.width || !box.height) return;
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

// Кнопка «Или оставьте заявку»: разворачивает форму по клику,
// чтобы она не висела на странице всегда открытой
(() => {
  const toggle = document.querySelector(".lead__toggle");
  const panel = document.querySelector(".lead__panel");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", () => {
    const open = panel.classList.contains("is-open");

    if (open) {
      panel.classList.remove("is-open");
      panel.inert = true; // сворачивается визуально через grid-rows;
      toggle.setAttribute("aria-expanded", "false"); // inert убирает фокус и чтение с экрана сразу, не дожидаясь transitionend
      return;
    }

    panel.hidden = false;
    panel.inert = false;
    panel.offsetHeight; // форсируем reflow, иначе transition не сыграет
    panel.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    panel.querySelector("input")?.focus();
  });
})();

// Direct links from service pages open the relevant project or enquiry form.
const openLinkedContent = () => {
  const id = location.hash.slice(1);
  if (/^work-[1-4]$/.test(id)) {
    const modal = document.getElementById(id);
    if (modal && !modal.open) modal.showModal();
  }
  if (id === "lead-panel") {
    const panel = document.querySelector(".lead__panel");
    if (panel && !panel.classList.contains("is-open")) {
      document.querySelector(".lead__toggle")?.click();
      panel.scrollIntoView({block: "center"});
    }
  }
};
window.addEventListener("hashchange", openLinkedContent);
openLinkedContent();
