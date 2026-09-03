// Согласие на куки. Метрика внутри loadMetrika() и запускается только
// по клику «Принять» — до выбора ни один cookie не ставится (152-ФЗ,
// ст. 9: аналитика без явного согласия — нарушение). Выбор живёт в
// localStorage, при повторном визите баннер не показываем: «принято» —
// сразу включаем аналитику, «отклонено» — молчим.
(() => {
  const KEY = "srb_cookie_consent";

  const loadMetrika = () => {
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112270109', 'ym');
    ym(112270109, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  };

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch {}

  if (stored === "accepted") { loadMetrika(); return; }
  if (stored === "declined") return;

  const bar = document.createElement("div");
  bar.className = "cookiebar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Согласие на куки");
  bar.innerHTML =
    '<p>Используем куки для аналитики (Яндекс.Метрика). ' +
    '<a href="privacy.html">Подробнее</a></p>' +
    '<span class="cookiebar__actions">' +
    '<button type="button" class="cookiebar__accept">Принять</button>' +
    '<button type="button" class="cookiebar__decline">Отклонить</button>' +
    '</span>';
  document.body.appendChild(bar);

  bar.querySelector(".cookiebar__accept").addEventListener("click", () => {
    try { localStorage.setItem(KEY, "accepted"); } catch {}
    loadMetrika();
    bar.remove();
  });
  bar.querySelector(".cookiebar__decline").addEventListener("click", () => {
    try { localStorage.setItem(KEY, "declined"); } catch {}
    bar.remove();
  });
})();
