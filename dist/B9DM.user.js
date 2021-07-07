// ==UserScript==
// @name        B9DM
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description surpress popup ads on B9DM
// @version     1.0.6
// @updateURL   https://github.com/kataoka271/userscripts/raw/master/dist/B9DM.user.js
// @include     http://b9good.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==
(function () {
    function removePopup() {
        document.body.childNodes.forEach((e) => {
            var _a, _b, _c;
            if (!(e instanceof HTMLElement)) {
                return;
            }
            if (e.className === "wrap" && ((_a = e.firstElementChild) === null || _a === void 0 ? void 0 : _a.id.indexOf("p_root_")) === 0) {
                putLogIf(e.style.display !== "none", "wrap class element", e);
                e.style.display = "none";
            }
            else if (e.style && parseInt(e.style.zIndex) > 10000) {
                putLogIf(e.style.visibility !== "hidden", "zIndex is too large", e);
                e.style.visibility = "hidden";
                e.style.backgroundColor = "rgba(200,50,50,0.5)";
                const child = e.firstElementChild;
                if (child instanceof HTMLElement && parseInt((_c = (_b = child === null || child === void 0 ? void 0 : child.style) === null || _b === void 0 ? void 0 : _b.zIndex) !== null && _c !== void 0 ? _c : 0) > 10000) {
                    putLogIf(child.style.visibility !== "hidden", "zIndex is too large", e);
                    child.style.visibility = "hidden";
                    child.style.backgroundColor = "rgba(200,50,50,0.5)";
                }
            }
        });
        setTimeout(removePopup, 3000);
    }
    function dummyWindowOpen() {
        console.log("dummyWindowOpen");
        return null;
    }
    window.open = dummyWindowOpen;
    function putLogIf(condition, text, elem) {
        if (!condition) {
            return;
        }
        console.log(text, elem);
    }
    window.addEventListener("message", function (e) {
        console.log("message", e);
        e.stopImmediatePropagation();
    }, true);
    window.addEventListener("DOMContentLoaded", removePopup, false);
})();
