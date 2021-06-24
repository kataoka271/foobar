// ==UserScript==
// @name        Manga
// @namespace   https://github.com/kataoka271
// @author      k_hir@hotmail.com
// @description manga viewer
// @version     1.0.0
// @updateURL   https://github.com/kataoka271/userscripts/blob/master/Manga.user.js
// @include     https://mangabank.org/*
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// ==/UserScript==
(function () {
    var _a, _b;
    GM_addStyle(`
:root {
  --manga-image-aspect: 0.6857143;
  --manga-pagenum-height: 15px;
  --manga-seeker-height: 8px;
  --manga-slider-height: calc(var(--manga-seeker-height) + var(--manga-pagenum-height) + 10px);
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
.manga-seeker {
  background-color: rgba(100, 100, 100, 0.85);
  width: 100%;
  cursor: pointer;
}
.manga-seeker > div {
  background-color: rgba(240, 170, 15, 0.85);
  transition: all 300ms 0s ease;
  margin-left: auto;
  height: var(--manga-seeker-height);
  margin-top: var(--manga-pagenum-height); /* adjust sum to .manga-pagenum height */
}
.manga-slider {
  background-color: black;
  overflow: hidden;
  width: min(calc(100vw - 20px - 50px), calc(2 * (100vh - var(--manga-slider-height)) * var(--manga-image-aspect)));
  height: calc(100vh - var(--manga-slider-height));
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
.manga-slides > img.manga-slides-full {
  width: 100%;
}
.manga-slides > img.manga-slides-half {
  width: 50%;
}
`);
    const dummyWindowOpen = () => {
        console.log("dummyWindowOpen");
    };
    unsafeWindow.open = exportFunction(dummyWindowOpen, unsafeWindow);
    const sitelist = [
        {
            pattern: "^https://loveheaven.net/",
            imgs: "div.chapter-content img",
            container: "div.chapter-content",
        },
        {
            pattern: "^https://mangabank.org/",
            imgs: "div#gallery-1 > figure > div > img",
            container: "div#gallery-1",
        },
    ];
    const defaultAspect = 960 / 1400; // px/px
    const wheelHoldTime = 300; // ms
    const $$ = (e) => {
        return document.querySelectorAll(e);
    };
    class Slides {
        constructor() {
            const viewer = document.createElement("div");
            const wrapper = document.createElement("div");
            const pagenum = document.createElement("div");
            const seeker = document.createElement("div");
            const seekbar = document.createElement("div");
            const slider = document.createElement("div");
            const slides = document.createElement("div");
            viewer.className = "manga-viewer";
            wrapper.className = "manga-wrapper";
            pagenum.className = "manga-pagenum";
            seeker.className = "manga-seeker";
            slider.className = "manga-slider";
            slides.className = "manga-slides";
            slider.appendChild(slides);
            seeker.appendChild(seekbar);
            wrapper.appendChild(seeker);
            wrapper.appendChild(pagenum);
            wrapper.appendChild(slider);
            viewer.appendChild(wrapper);
            this.viewer = viewer;
            this.pagenum = pagenum;
            this.seeker = seeker;
            this.seekbar = seekbar;
            this.slides = slides;
            this.numPages = 0;
            this.slideOffset = 0;
            this.wheelHoldTimeStamp = 0;
            this.imageList = [];
            this.viewer.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.close();
            });
            this.seeker.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.currentTarget instanceof HTMLElement) {
                    this.seekOffset(e.clientX - e.currentTarget.getBoundingClientRect().left);
                }
            });
            slider.addEventListener("wheel", (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (e.timeStamp - this.wheelHoldTimeStamp < wheelHoldTime) {
                    return;
                }
                this.wheelHoldTimeStamp = e.timeStamp;
                if (e.deltaY < 0) {
                    this.goPrev(e.shiftKey);
                }
                else if (e.deltaY > 0) {
                    this.goNext(e.shiftKey);
                }
            });
        }
        get elem() {
            return this.viewer;
        }
        setOffset(offset) {
            if (offset < 0) {
                offset = 0;
            }
            else if (offset > this.numPages - 2) {
                offset = this.numPages - 2;
            }
            this.slides.style.transform = "translateX(" + -50 * (this.numPages - 2 - offset) + "%)";
            this.pagenum.innerHTML = offset + 2 + "/" + this.numPages;
            this.seekbar.style.width = (100.0 * (offset + 2)) / this.numPages + "%";
            this.loadImage(offset);
            this.loadImage(offset + 1);
            this.loadImage(offset + 2);
            this.loadImage(offset + 3);
            this.loadImage(offset - 1);
            this.loadImage(offset - 2);
            this.fitToImage(this.imageList[offset]);
            this.slideOffset = offset;
        }
        seekOffset(pos) {
            this.setOffset(Math.floor(this.numPages * (1.0 - pos / this.seeker.clientWidth)));
        }
        getGlobalAspect() {
            return parseFloat(document.documentElement.style.getPropertyValue("--manga-image-aspect"));
        }
        setGlobalAspect(aspect) {
            document.documentElement.style.setProperty("--manga-image-aspect", aspect.toString());
            console.log("set-aspect", aspect);
        }
        goNext(shift) {
            this.setOffset(this.slideOffset + (shift ? 1 : 2));
        }
        goPrev(shift) {
            this.setOffset(this.slideOffset - (shift ? 1 : 2));
        }
        open() {
            this.viewer.style.display = "block";
        }
        close() {
            this.viewer.style.display = "none";
        }
        addImage(img) {
            if (img.isFull()) {
                this.imageList.push(img);
                this.imageList.push(img);
                this.numPages += 2;
            }
            else {
                this.imageList.push(img);
                this.numPages += 1;
            }
            this.slides.insertBefore(img.elem, this.slides.firstChild);
        }
        fitToImage(img) {
            if (!img.complete) {
                img.on("load", () => this.fitToImage(img));
                return;
            }
            let aspect = img.getImageAspect();
            if (aspect > 1) {
                aspect = aspect / 2;
            }
            aspect = Math.round(aspect * 1000) / 1000;
            if (Math.abs(this.getGlobalAspect() - aspect) < 0.001) {
                return;
            }
            this.setGlobalAspect(aspect);
        }
        loadImage(offset) {
            if (offset < 0 || offset >= this.imageList.length) {
                return;
            }
            this.imageList[offset].loadLazy();
        }
        createOpenButton(title) {
            const button = document.createElement("a");
            button.innerHTML = title;
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.open();
            });
            return button;
        }
    }
    class WrappedImage {
        constructor(img) {
            var _a;
            this.img = img;
            if (this.isFull()) {
                img.className = "manga-slides-full";
            }
            else {
                img.className = "manga-slides-half";
            }
            if (img.hasAttribute("data-src")) {
                img.setAttribute("manga-src", (_a = img.getAttribute("data-src")) !== null && _a !== void 0 ? _a : "");
                img.removeAttribute("data-src");
            }
            img.loading = "eager";
            img.addEventListener("click", () => this.loadForce());
        }
        get elem() {
            return this.img;
        }
        get complete() {
            return this.img.complete;
        }
        on(event, func) {
            this.img.addEventListener(event, func);
        }
        loadLazy() {
            const dataSrc = this.img.getAttribute("manga-src");
            const src = this.img.getAttribute("src");
            if (dataSrc !== null && dataSrc !== src) {
                this.img.src = dataSrc;
            }
        }
        loadForce() {
            const url = this.img.getAttribute("manga-src");
            if (url === null) {
                return;
            }
            if (url === this.img.src && this.img.complete) {
                console.log("Image has already loaded");
                return;
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: 5000,
                responseType: "blob",
                onload: (xhr) => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            this.img.src = URL.createObjectURL(xhr.response);
                            this.img.setAttribute("manga-src", this.img.src);
                        }
                        else {
                            console.error(xhr.status + " " + xhr.statusText);
                        }
                    }
                },
                ontimeout: () => {
                    console.error("The request for " + url + " timed out");
                },
            });
        }
        getImageAspect() {
            const aWidth = this.img.getAttribute("width");
            const aHeight = this.img.getAttribute("height");
            const dataSrc = this.img.getAttribute("manga-src");
            const src = this.img.getAttribute("src");
            if (aWidth && aHeight) {
                return parseInt(aWidth) / parseInt(aHeight);
            }
            else if (dataSrc == src && this.img.naturalWidth > 0 && this.img.naturalHeight > 0) {
                return this.img.naturalWidth / this.img.naturalHeight;
            }
            else {
                return defaultAspect;
            }
        }
        isFull() {
            return this.getImageAspect() > 1;
        }
    }
    const site = sitelist.find((it) => new RegExp(it.pattern).test(location.href));
    if (!site) {
        return;
    }
    const imgs = $$(site.imgs);
    if (imgs.length == 0) {
        return;
    }
    const container = $$(site.container)[0];
    if (!container) {
        return;
    }
    const slides = new Slides();
    imgs.forEach((img) => slides.addImage(new WrappedImage(img)));
    document.body.appendChild(slides.elem);
    (_a = container.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(slides.createOpenButton("Open Manga Viewer"), container);
    (_b = container.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(container);
    document.body.addEventListener("keydown", (e) => {
        if (e.key == "ArrowRight") {
            slides.goPrev(e.shiftKey);
        }
        else if (e.key == "ArrowLeft") {
            slides.goNext(e.shiftKey);
        }
        else if (e.key == "Escape") {
            slides.close();
        }
    });
    slides.setOffset(0);
})();
