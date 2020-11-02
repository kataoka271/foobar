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
  const defaultImageWidth = 960; // px
  const defaultImageHeight = 1400; // px

  let $$ = e => document.querySelectorAll(e);

  function dummyWindowOpen() {
    console.log("dummyWindowOpen");
  }
  unsafeWindow.open = exportFunction(unsafeWindow, dummyWindowOpen);

  GM_addStyle(`
:root {
  --manga-image-aspect: 1.0;
}
.manga-viewer {
  background-color: rgba(0, 0, 0, 0.85);
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  margin: 0;
  padding: 0;
  z-index: 2000;
}
.manga-wrapper {
  margin: auto;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.manga-pagenum {
  text-align: center;
  font-size: 12pt;
  color: rgb(255, 255, 255);
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  height: 1.5em;
}
.manga-pagenum-progress {
  background-color: rgba(100, 100, 180, 0.85);
  transition: all 300ms 0s ease;
  margin-top: 1.0em;
  margin-left: auto;
  padding-top: 0.5em;
}
.manga-sliding {
  background-color: black;
  overflow: hidden;
  width: min(calc(100vw - 20px - 50px), calc(200vh * var(--manga-image-aspect) - 50px));
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
  let viewer = document.createElement("div");
  viewer.className = "manga-viewer";
  let wrapper = document.createElement("div");
  wrapper.className = "manga-wrapper";
  let pagenum = document.createElement("div");
  pagenum.className = "manga-pagenum";
  pagenum.innerHTML = "0/" + imgs.length;
  let pagenumprogress = document.createElement("div");
  pagenumprogress.className = "manga-pagenum-progress";
  pagenumprogress.innerHTML = " ";
  let sliding = document.createElement("div");
  sliding.className = "manga-sliding";
  imgs[0].addEventListener("load", function () {
    let width = parseInt(this.getAttribute("width")) || this.width || defaultImageWidth;
    let height = parseInt(this.getAttribute("height")) || this.height || defaultImageHeight;
    document.documentElement.style.setProperty("--manga-image-aspect", width / height);
  });
  let slides = document.createElement("div");
  slides.className = "manga-slides";
  imgs.forEach(function (img) {
    img.className = "manga-img";
    slides.insertBefore(img, slides.firstChild);
  });
  sliding.appendChild(slides);
  wrapper.appendChild(pagenumprogress);
  wrapper.appendChild(pagenum);
  wrapper.appendChild(sliding);
  viewer.appendChild(wrapper);

  let shower = document.createElement("a");
  shower.innerHTML = "Show Manga Viewer";
  shower.addEventListener("click", function (e) { e.preventDefault(); viewer.style.display = "block"; });
  viewer.addEventListener("dblclick", function (e) { e.preventDefault(); viewer.style.display = "none"; });

  document.body.appendChild(viewer);
  container.parentNode.insertBefore(shower, container);
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
    pagenumprogress.style.width = (100.0 * page / imgs.length) + "%";
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