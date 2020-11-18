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
  const defaultAspect = 960 / 1400; // px/px

  let $$ = e => document.querySelectorAll(e);

  let dummyWindowOpen = function () {
    console.log("dummyWindowOpen");
  }
  unsafeWindow.open = exportFunction(unsafeWindow, dummyWindowOpen);

  GM_addStyle(`
:root {
  --manga-image-aspect: 0.6857143;
  --manga-pagenum-height: 15px;
  --manga-page-progress-height: 8px;
  --manga-sliding-height: calc(var(--manga-page-progress-height) + var(--manga-pagenum-height) + 10px);
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
  height: 100%;
  transform: translate(-50%, -50%);
}
.manga-pagenum {
  text-align: center;
  font-size: 12pt;
  color: rgb(255, 255, 255);
  position: absolute;
  top: 0;
  left: 0;
  height: var(--manga-pagenum-height);
}
.manga-page-progress {
  background-color: rgba(100, 100, 100, 0.85);
  width: 100%;
  cursor: pointer;
}
.manga-page-progress > div {
  background-color: rgba(240, 170, 15, 0.85);
  transition: all 300ms 0s ease;
  margin-left: auto;
  height: var(--manga-page-progress-height);
  margin-top: var(--manga-pagenum-height); /* adjust sum to .manga-pagenum height */
}
.manga-sliding {
  background-color: black;
  overflow: hidden;
  width: min(calc(100vw - 20px - 50px), calc(2 * (100vh - var(--manga-sliding-height)) * var(--manga-image-aspect)));
  height: calc(100vh - var(--manga-sliding-height));
}
.manga-slides {
  transition: all 300ms 0s ease;
  display: flex;
  align-items: flex-start;
}
.manga-slides > img {
  flex-shrink: 0;
  width: 50%;
  height: 100%;
}
.manga-slides > img.manga-slides-wide {
  width: 100%;
}
.manga-slides > img.manga-slides-half {
  width: 50%;
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
  let pageprogress = document.createElement("div");
  pageprogress.className = "manga-page-progress";
  let pageprogressbar = document.createElement("div");
  let sliding = document.createElement("div");
  sliding.className = "manga-sliding";
  let getAspect = function (img) {
    let aWidth = img.getAttribute("width");
    let aHeight = img.getAttribute("height");
    let dataSrc = img.getAttribute("data-src");
    let src = img.getAttribute("src");
    let aspect = defaultAspect;
    if (aWidth && aHeight) {
      aspect = parseInt(aWidth) / parseInt(aHeight);
    } else if (dataSrc == src && img.naturalWidth > 0 && img.naturalHeight > 0) {
      aspect = img.naturalWidth / img.naturalHeight;
    }
    return aspect;
  };
  let slides = document.createElement("div");
  slides.className = "manga-slides";
  let pages = [];
  imgs.forEach(function (img, idx) {
    if (getAspect(img) > 1) {
      img.className = "manga-slides-wide";
      pages.push(idx);
      pages.push(idx);
    } else {
      img.className = "manga-slides-half";
      pages.push(idx);
    }
    slides.insertBefore(img, slides.firstChild);
  });
  let setAspect = function (img) {
    if (!img.complete) {
      return;
    }
    let aspect = getAspect(img);
    if (aspect > 1) {
      aspect = aspect / 2;
    }
    aspect = Math.round(aspect * 1000) / 1000;
    if (aspect == document.documentElement.style.getPropertyValue("--manga-image-aspect")) {
      return;
    }
    console.log("set-aspect", aspect);
    document.documentElement.style.setProperty("--manga-image-aspect", aspect);
  };
  sliding.appendChild(slides);
  pageprogress.appendChild(pageprogressbar);
  wrapper.appendChild(pageprogress);
  wrapper.appendChild(pagenum);
  wrapper.appendChild(sliding);
  viewer.appendChild(wrapper);

  let shower = document.createElement("a");
  shower.innerHTML = "Show Manga Viewer";
  shower.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();
    viewer.style.display = "block";
  });
  viewer.addEventListener("dblclick", function (e) {
    e.stopPropagation();
    e.preventDefault();
    viewer.style.display = "none";
  });

  document.body.appendChild(viewer);
  container.parentNode.insertBefore(shower, container);
  container.parentNode.removeChild(container);

  let currentPageLeft = 0;
  let loadPage = function (page) {
    if (page >= 0 && page < pages.length) {
      let img = imgs[pages[page]];
      let dataSrc = img.getAttribute("data-src");
      let src = img.getAttribute("src");
      if (dataSrc != src) {
        img.src = dataSrc;
      }
    }
  };
  let showPage = function (page) {
    page = Math.min(pages.length, Math.max(0, page)); // 0 <= page <= n
    let x = -50 * (pages.length - 1 - page); // -50 * (n - 1) <= x <= 50
    slides.style.transform = "translateX(" + x + "%)";
    pagenum.innerHTML = Math.min(pages.length, page + 1) + "/" + pages.length; // 1/n <= pagenum <= n/n
    pageprogressbar.style.width = (100.0 * Math.min(pages.length, page + 1) / pages.length) + "%"; // 100/n <= width <= 100
    loadPage(page - 2);
    loadPage(page - 1);
    loadPage(page);
    loadPage(page + 1);
    loadPage(page + 2);
    if (page >= 0 && page < pages.length) {
      setAspect(imgs[pages[page]]);
    }
    currentPageLeft = page;
  };
  let goNext = (shift) => showPage(currentPageLeft + (shift ? 1 : 2));
  let goPrev = (shift) => showPage(currentPageLeft - (shift ? 1 : 2));
  showPage(0);

  pageprogress.addEventListener("click", function (e) {
    e.stopPropagation();
    e.preventDefault();
    let rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let r = 1.0 - x / pageprogress.clientWidth; // 0.0 < r < 1.0
    // if 0 <= r < 1/n then page = 0
    // if (n-1)/n <= r < 1 then page = n-1
    // if r = 1 then page = n
    let page = Math.floor(r * pages.length); // 0 <= page < n
    showPage(page);
  });

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