// ==UserScript==
// @name        Manga
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description manga viewer
// @version     1.0.0
// @updateURL   https://github.com/kataoka271/foobar/blob/master/Manga.user.js
// @include     https://loveheaven.net/*
// @grant       none
// ==/UserScript==

(function () {

  let $$ = e => document.querySelectorAll(e);

  function dummyWindowOpen() {
    console.log("dummyWindowOpen");
  }
  window.open = dummyWindowOpen;

  let currentPageLeft = 0;
  let imgs = $$("div.chapter-content > img");
  let div = document.createElement("div");
  let old = $$("div.chapter-content")[0];
  div.className = "chapter-content";
  div.style.overflow = "hidden";
  div.style.width = "100%";
  div.style.height = "80%";
  imgs.forEach(function (img) {
    div.appendChild(img);
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
    img.style.width = "50%";
    img.style.height = "auto";
    img.style.display = "none";
  });
  if (imgs.length >= 2) {
    imgs[0].style.display = "";
    imgs[1].style.display = "";
  }
  old.parentNode.insertBefore(div, old);
  old.parentNode.removeChild(old);

  let showPage = function (page) {
    if (page < 0) {
      page = 0;
    } else if (page >= imgs.length - 1) {
      page = imgs.length - 2;
    }
    imgs[currentPageLeft].style.display = "none";
    imgs[currentPageLeft + 1].style.display = "none";
    imgs[page].style.display = "";
    imgs[page + 1].style.display = "";
    currentPageLeft = page;
  };
  addEventListener("keydown", function (e) {
    if (e.keyCode == 37) {
      showPage(currentPageLeft - (e.shiftKey ? 1 : 2))
    } else if (e.keyCode == 39) {
      showPage(currentPageLeft + (e.shiftKey ? 1 : 2))
    }
  });

})();