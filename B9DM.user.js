// ==UserScript==
// @name        B9DM
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description surpress popup ads on B9DM
// @version     1.0.5
// @updateURL   https://github.com/kataoka271/foobar/blob/master/B9DM.user.js
// @include     http://b9good.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==

(function () {

  function removePopup() {
    for (var e = document.body.firstElementChild; e != null; e = e.nextElementSibling) {
      if (e.className === "wrap" && e.firstElementChild && e.firstElementChild.id.indexOf("p_root_") === 0) {
        report(e.style.display !== "none", "wrap class element", e);
        e.style.display = "none";
      } else if (e.style && e.style.zIndex > 10000) {
        report(e.style.visibility !== "hidden", "zIndex is too large", e);
        e.style.visibility = "hidden";
        e.style.backgroundColor = "rgba(200,50,50,0.5)";
        if (e.firstElementChild && e.firstElementChild.style && e.firstElementChild.style.zIndex > 10000) {
          report(e.firstElementChild.style.visibility !== "hidden", "zIndex is too large", e);
          e.firstElementChild.style.visibility = "hidden";
          e.firstElementChild.style.backgroundColor = "rgba(200,50,50,0.5)";
        }
      }
    }
    setTimeout(removePopup, 3000);
  }

  function dummyWindowOpen() {
    console.log("dummyWindowOpen");
  }

  function report(pred, text, elem) {
    if (pred) {
      console.log(text, elem);
    }
  }

  addEventListener("message", function (e) {
    console.log("message", e);
    e.stopImmediatePropagation();
  }, true);
  addEventListener("DOMContentLoaded", removePopup, false);
  window.open = dummyWindowOpen;

})();
