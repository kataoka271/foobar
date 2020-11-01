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
.manga-wrapper {
  margin: auto;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}
.manga-pagenum {
  text-align: center;
  font-size: 12pt;
}
.manga-sliding {
  background-color: black;
  overflow: hidden;
  width: 100%;
  height: auto;
}
.manga-slides {
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
      container: "div#gallery-1"
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
  let wrapper = document.createElement("div");
  wrapper.className = "manga-wrapper";
  let pagenum = document.createElement("div");
  pagenum.className = "manga-pagenum";
  pagenum.innerHTML = "0/" + imgs.length;
  let sliding = document.createElement("div");
  sliding.className = "manga-sliding";
  let width = imgs[0].getAttribute("width") ? parseInt(imgs[0].getAttribute("width")) : imgs[0].width;
  let height = imgs[0].getAttribute("height") ? parseInt(imgs[0].getAttribute("height")) : imgs[0].height;
  let aspect = width / height;
  sliding.style.width = "min(calc(100vw - 20px - 100px), calc(200vh * " + aspect + " - 100px))";
  let slides = document.createElement("div");
  slides.className = "manga-slides";
  imgs.forEach(function (img) {
    img.className = "manga-img";
    slides.insertBefore(img, slides.firstChild);
  });
  sliding.appendChild(slides);
  wrapper.appendChild(pagenum);
  wrapper.appendChild(sliding);
  container.parentNode.insertBefore(wrapper, container);
  container.parentNode.removeChild(container);

  let currentPageLeft = 0;
  let loadPage = function (page) {
    if (page >= 0 && page < imgs.length && imgs[page].getAttribute("data-src")) {
      imgs[page].src = imgs[page].getAttribute("data-src");
    }
  };
  let showPage = function (page) {
    page = Math.min(imgs.length, Math.max(0, page));
    let x = -50 * (imgs.length - 1 - page);
    slides.style.transform = "translateX(" + x + "%)";
    pagenum.innerHTML = (1 + page) + "/" + imgs.length;
    loadPage(page + 1);
    loadPage(page + 2);
    loadPage(page - 1);
    loadPage(page - 2);
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