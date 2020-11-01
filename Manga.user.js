// ==UserScript==
// @name        Manga
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description manga viewer
// @version     1.0.0
// @updateURL   https://github.com/kataoka271/foobar/blob/master/Manga.user.js
// @include     https://loveheaven.net/*
// @include     https://mangabank.org/*
// @grant       GM_addStyle
// ==/UserScript==

(function () {

  const wheelholdtime = 300; // ms

  let $$ = e => document.querySelectorAll(e);

  function dummyWindowOpen() {
    console.log("dummyWindowOpen");
  }
  unsafeWindow.open = exportFunction(unsafeWindow, dummyWindowOpen);

  GM_addStyle(`
.manga-sliding {
  background-color: black;
  overflow: hidden;
  margin: auto;
  width: 100%;
  height: auto;
  position: absolute;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 2000;
}
.manga-content {
  transition: all 300ms 0s ease;
  display: flex;
}
.manga-img {
  flex-shrink: 0;
  width: 50%;
  height: auto;
}
`);

  let siteinfo = [
    {
      pattern: "^https://loveheaven.net/",
      imgs: "div.chapter-content > img",
      container: "div.chapter-content"
    },
    {
      pattern: "^https://mangabank.org/",
      imgs: "div#gallery-1 > figure > div > img",
      container: "div#gallery-1",
      lazyload: () => unsafeWindow.jQuery(unsafeWindow.document).trigger("customlazyloadxtevent")
    }
  ];

  let site = siteinfo.find(si => new RegExp(si.pattern).test(location.href));
  if (!site) {
    return;
  }
  let imgs = $$(site.imgs);
  if (imgs.length == 0) {
    return;
  }
  let container = $$(site.container)[0];
  if (!container) {
    return;
  }
  let sliding = document.createElement("div");
  sliding.className = "manga-sliding";
  let width = imgs[0].getAttribute("width") ? parseInt(imgs[0].getAttribute("width")) : imgs[0].width;
  let height = imgs[0].getAttribute("height") ? parseInt(imgs[0].getAttribute("height")) : imgs[0].height;
  let aspect = width / height;
  sliding.style.width = "min(calc(100vw - 20px), calc(200vh * " + aspect + "))";
  let content = document.createElement("div");
  content.className = "manga-content";
  if (site.lazyload) {
    content.addEventListener("transitionend", site.lazyload);
  }
  imgs.forEach(function (img) {
    img.className = "manga-img";
    content.insertBefore(img, content.firstChild);
  });
  sliding.appendChild(content);
  container.parentNode.insertBefore(sliding, container);
  container.parentNode.removeChild(container);

  let currentPageLeft = 0;
  let showPage = function (page) {
    page = Math.min(imgs.length, Math.max(0, page));
    let x = -50 * (imgs.length - 1 - page);
    content.style.transform = "translateX(" + x + "%)";
    currentPageLeft = page;
  };
  let goNext = (shift) => showPage(currentPageLeft + (shift ? 1 : 2));
  let goPrev = (shift) => showPage(currentPageLeft - (shift ? 1 : 2));
  showPage(0);

  addEventListener("keydown", function (e) {
    if (e.key == "ArrowRight") {
      goPrev(e.shiftKey);
    } else if (e.key == "ArrowLeft") {
      goNext(e.shiftKey);
    }
  });

  let lasttime = 0;
  sliding.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.timeStamp - lasttime < wheelholdtime) {
      return;
    }
    lasttime = e.timeStamp;
    if (e.deltaY < 0) {
      goPrev(e.shiftKey);
    } else if (e.deltaY > 0) {
      goNext(e.shiftKey);
    }
  });

})();