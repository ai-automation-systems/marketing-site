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

// Форма заявки: отправляет данные в функцию Яндекс Облака,
// та шлёт письмо на почту. Пока адрес не прописан в config.js —
// не делаем вид, что заявка ушла, а честно отправляем в Telegram.
(() => {
  const form = document.querySelector(".lead__form");
  if (!form) return;

  const status = form.querySelector(".lead__status");
  const submit = form.querySelector(".lead__submit");
  // config.js объявляет SITE_CONFIG через const — в window он не попадает,
  // поэтому обращаемся к переменной напрямую, как и остальной код файла
  const endpoint = (typeof SITE_CONFIG !== "undefined" && SITE_CONFIG.leadEndpoint) || "";
  const ready = endpoint && !/REPLACE_WITH/.test(endpoint);

  const say = (cls, text) => {
    status.className = "lead__status " + cls;
    status.textContent = text;
  };

  form.addEventListener("submit", async e => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    if (!ready) {
      say("is-err", "Форма пока настраивается. Напишите нам в Telegram, ответим быстрее.");
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    delete data.agree;

    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = "Отправляем…";
    say("", "");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, page: location.pathname }),
      });
      const out = await res.json().catch(() => ({}));
      // почта ещё не подключена в настройках функции: это не поломка,
      // а незавершённая настройка — и говорить об этом надо иначе
      if (out.error === "smtp not configured") {
        say("is-err", "Форма пока настраивается. Напишите нам в Telegram, ответим быстрее.");
        return;
      }
      if (!res.ok || !out.ok) throw new Error();
      form.reset();
      say("is-ok", "Заявку получили. Посмотрим ваши площадки и ответим в течение рабочего дня.");
    } catch {
      say("is-err", "Не удалось отправить. Напишите нам в Telegram, разберёмся.");
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
})();
