// ==UserScript==
// @name        Manga
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description manga viewer
// @version     1.0.0
// @updateURL   https://github.com/kataoka271/foobar/blob/master/Manga.user.js
// @include     https://loveheaven.net/*
// @grant       GM_addStyle
// ==/UserScript==

(function () {

  let $$ = e => document.querySelectorAll(e);

  function dummyWindowOpen() {
    console.log("dummyWindowOpen");
  }
  window.open = dummyWindowOpen;

  GM_addStyle(`
.chapter-sliding2 {
  background-color: black;
  overflow: hidden;
  margin: auto;
  max-width: 120vmin;
}
.chapter-content2 {
  transition: all 300ms 0s ease;
  display: flex;
}
.chapter-img2 {
  flex-shrink: 0;
  width: 50%;
  height: auto;
}
`);

  let imgs = $$("div.chapter-content > img");
  if (imgs.length == 0) {
    return;
  }
  let old = $$("div.chapter-content")[0];
  if (!old) {
    return;
  }
  let sliding = document.createElement("div");
  sliding.className = "chapter-sliding2";
  let content = document.createElement("div");
  content.className = "chapter-content2";
  imgs.forEach(function (img) {
    img.className = "chapter-img2";
    content.insertBefore(img, content.firstChild);
  });
  sliding.appendChild(content);
  old.parentNode.insertBefore(sliding, old);
  old.parentNode.removeChild(old);

  let currentPageLeft = 0;
  let showPage = function (page) {
    page = Math.min(imgs.length, Math.max(0, page));
    let x = -50 * (imgs.length - 1 - page);
    content.style.transform = "translateX(" + x + "%)";
    currentPageLeft = page;
  };
  showPage(0);
  addEventListener("keydown", function (e) {
    if (e.keyCode == 39) {
      showPage(currentPageLeft - (e.shiftKey ? 1 : 2))
    } else if (e.keyCode == 37) {
      showPage(currentPageLeft + (e.shiftKey ? 1 : 2))
    }
  });

})();