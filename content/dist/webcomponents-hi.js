(function() {
    /*

     Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
     This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
     The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
     The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
     Code distributed by Google as part of the polymer project is also
     subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

     Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
     This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
     The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
     The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
     Code distributed by Google as part of the polymer project is also
     subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

    Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
    The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
    The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
    Code distributed by Google as part of the polymer project is also
    subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
    */
    'use strict';
    (function(m) {
        function n(a, b) {
            if ("function" === typeof window.CustomEvent)
                return new CustomEvent(a, b);
            var c = document.createEvent("CustomEvent");
            c.initCustomEvent(a, !!b.bubbles, !!b.cancelable, b.detail);
            return c
        }
        function k(a) {
            if (z)
                return a.ownerDocument !== document ? a.ownerDocument : null;
            var b = a.__importDoc;
            if (!b && a.parentNode) {
                b = a.parentNode;
                if ("function" === typeof b.closest)
                    b = b.closest("link[rel=import]");
                else
                    for (; !u(b) && (b = b.parentNode);)
                        ;
                a.__importDoc = b
            }
            return b
        }
        function v(a) {
            var b = document.querySelectorAll("link[rel=import]:not(import-dependency)"),
                c = b.length;
            if (c)
                for (var d = 0, e = b.length, h; d < e && (h = b[d]); d++)
                    w(h, function() {
                        --c || a()
                    });
            else
                a()
        }
        function q(a) {
            function b() {
                "loading" !== document.readyState && document.body && (document.removeEventListener("readystatechange", b), a())
            }
            document.addEventListener("readystatechange", b);
            b()
        }
        function p(a) {
            q(function() {
                return v(function() {
                    return a && a()
                })
            })
        }
        function w(a, b) {
            if (a.__loaded)
                b && b();
            else if ("script" !== a.localName || a.src) {
                var c = function(d) {
                    a.removeEventListener(d.type, c);
                    a.__loaded = !0;
                    b && b()
                };
                a.addEventListener("load",
                c);
                A && "style" === a.localName || a.addEventListener("error", c)
            } else
                a.__loaded = !0,
                b && b()
        }
        function u(a) {
            return a.nodeType === Node.ELEMENT_NODE && "link" === a.localName && "import" === a.rel
        }
        function l() {
            var a = this;
            this.b = {};
            this.c = 0;
            this.h = new MutationObserver(function(b) {
                return a.C(b)
            });
            this.h.observe(document.head, {
                childList: !0,
                subtree: !0
            });
            this.f(document)
        }
        var z = "import" in document.createElement("link"),
            B = null;
        !1 === "currentScript" in document && Object.defineProperty(document, "currentScript", {
            get: function() {
                return B ||
                    ("complete" !== document.readyState ? document.scripts[document.scripts.length - 1] : null)
            },
            configurable: !0
        });
        var G = /(^\/)|(^#)|(^[\w-\d]*:)/,
            H = /(url\()([^)]*)(\))/g,
            I = /(@import[\s]+(?!url\())([^;]*)(;)/g,
            J = /(<link[^>]*)(rel=['|"]?stylesheet['|"]?[^>]*>)/g,
            f = {
                A: function(a, b) {
                    a.href && a.setAttribute("href", f.i(a.getAttribute("href"), b));
                    a.src && a.setAttribute("src", f.i(a.getAttribute("src"), b));
                    if ("style" === a.localName) {
                        var c = f.u(a.textContent, b, H);
                        a.textContent = f.u(c, b, I)
                    }
                },
                u: function(a, b, c) {
                    return a.replace(c,
                    function(a, c, h, g) {
                        a = h.replace(/["']/g, "");
                        b && (a = f.v(a, b));
                        return c + "'" + a + "'" + g
                    })
                },
                i: function(a, b) {
                    return a && G.test(a) ? a : f.v(a, b)
                },
                v: function(a, b) {
                    if (void 0 === f.g) {
                        f.g = !1;
                        try {
                            var c = new URL("b", "http://a");
                            c.pathname = "c%20d";
                            f.g = "http://a/c%20d" === c.href
                        } catch (d) {}
                    }
                    if (f.g)
                        return (new URL(a, b)).href;
                    c = f.w;
                    c || (c = document.implementation.createHTMLDocument("temp"), f.w = c, c.l = c.createElement("base"), c.head.appendChild(c.l), c.j = c.createElement("a"));
                    c.l.href = b;
                    c.j.href = a;
                    return c.j.href || a
                }
            },
            D = {
                async: !0,
                load: function(a,
                b, c) {
                    if (a)
                        if (a.match(/^data:/)) {
                            a = a.split(",");
                            var d = a[1],
                                d = -1 < a[0].indexOf(";base64") ? atob(d) : decodeURIComponent(d);
                            b(d)
                        } else {
                            var e = new XMLHttpRequest;
                            e.open("GET", a, D.async);
                            e.onload = function() {
                                var a = e.getResponseHeader("Location");
                                a && !a.indexOf("/") && (a = (location.origin || location.protocol + "//" + location.host) + a);
                                var d = e.response || e.responseText;
                                304 === e.status || !e.status || 200 <= e.status && 300 > e.status ? b(d, a) : c(d)
                            };
                            e.send()
                        }
                    else
                        c("error: href must be specified")
                }
            },
            A = /Trident/.test(navigator.userAgent) ||
            /Edge\/\d./i.test(navigator.userAgent);
        l.prototype.f = function(a) {
            a = a.querySelectorAll("link[rel=import]");
            for (var b = 0, c = a.length; b < c; b++)
                this.o(a[b])
        };
        l.prototype.o = function(a) {
            var b = this,
                c = a.href;
            if (void 0 !== this.b[c]) {
                var d = this.b[c];
                d && d.__loaded && (a.import = d, this.m(a))
            } else
                this.c++,
                this.b[c] = "pending",
                D.load(c, function(a, d) {
                    a = b.D(a, d || c);
                    b.b[c] = a;
                    b.c--;
                    b.f(a);
                    b.s()
                }, function() {
                    b.b[c] = null;
                    b.c--;
                    b.s()
                })
        };
        l.prototype.D = function(a, b) {
            if (!a)
                return document.createDocumentFragment();
            A && (a = a.replace(J,
            function(a, b, c) {
                return -1 === a.indexOf("type=") ? b + " type=import-disable " + c : a
            }));
            var c = document.createElement("template");
            c.innerHTML = a;
            if (c.content)
                a = c.content;
            else
                for (a = document.createDocumentFragment(); c.firstChild;)
                    a.appendChild(c.firstChild);
            if (c = a.querySelector("base"))
                b = f.i(c.getAttribute("href"), b),
                c.removeAttribute("href");
            for (var c = a.querySelectorAll('link[rel=import], link[rel=stylesheet][href][type=import-disable],\n    style:not([type]), link[rel=stylesheet][href]:not([type]),\n    script:not([type]), script[type="application/javascript"],\n    script[type="text/javascript"]'),
                d = 0, e = 0, h = c.length, g; e < h && (g = c[e]); e++)
                w(g),
                f.A(g, b),
                g.setAttribute("import-dependency", ""),
                "script" === g.localName && !g.src && g.textContent && (g.setAttribute("src", "data:text/javascript;charset=utf-8," + encodeURIComponent(g.textContent + ("\n//# sourceURL=" + b + (d ? "-" + d : "") + ".js\n"))), g.textContent = "", d++);
            return a
        };
        l.prototype.s = function() {
            var a = this;
            if (!this.c) {
                this.h.disconnect();
                this.flatten(document);
                var b = !1,
                    c = !1,
                    d = function() {
                        c && b && (a.f(document), a.c || (a.h.observe(document.head, {
                            childList: !0,
                            subtree: !0
                        }),
                        a.B()))
                    };
                this.G(function() {
                    c = !0;
                    d()
                });
                this.F(function() {
                    b = !0;
                    d()
                })
            }
        };
        l.prototype.flatten = function(a) {
            a = a.querySelectorAll("link[rel=import]");
            for (var b = 0, c = a.length, d; b < c && (d = a[b]); b++) {
                var e = this.b[d.href];
                (d.import = e) && e.nodeType === Node.DOCUMENT_FRAGMENT_NODE && (this.b[d.href] = d, d.readyState = "loading", d.import = d, this.flatten(e), d.appendChild(e))
            }
        };
        l.prototype.F = function(a) {
            function b(e) {
                if (e < d) {
                    var h = c[e],
                        g = document.createElement("script");
                    h.removeAttribute("import-dependency");
                    for (var x = 0, f = h.attributes.length; x <
                    f; x++)
                        g.setAttribute(h.attributes[x].name, h.attributes[x].value);
                    B = g;
                    h.parentNode.replaceChild(g, h);
                    w(g, function() {
                        B = null;
                        b(e + 1)
                    })
                } else
                    a()
            }
            var c = document.querySelectorAll("script[import-dependency]"),
                d = c.length;
            b(0)
        };
        l.prototype.G = function(a) {
            var b = document.querySelectorAll("style[import-dependency],\n    link[rel=stylesheet][import-dependency]"),
                c = b.length;
            if (c)
                for (var d = A && !!document.querySelector("link[rel=stylesheet][href][type=import-disable]"), e = {}, h = 0, g = b.length; h < g && (e.a = b[h]); e = {
                    a: e.a
                },
                h++) {
                    if (w(e.a, function(b) {
                        return function() {
                            b.a.removeAttribute("import-dependency");
                            --c || a()
                        }
                    }(e)), d && e.a.parentNode !== document.head) {
                        var f = document.createElement(e.a.localName);
                        f.__appliedElement = e.a;
                        f.setAttribute("type", "import-placeholder");
                        e.a.parentNode.insertBefore(f, e.a.nextSibling);
                        for (f = k(e.a); f && k(f);)
                            f = k(f);
                        f.parentNode !== document.head && (f = null);
                        document.head.insertBefore(e.a, f);
                        e.a.removeAttribute("type")
                    }
                }
            else
                a()
        };
        l.prototype.B = function() {
            for (var a = document.querySelectorAll("link[rel=import]"),
                b = a.length - 1, c; 0 <= b && (c = a[b]); b--)
                this.m(c)
        };
        l.prototype.m = function(a) {
            a.__loaded || (a.__loaded = !0, a.import && (a.import.readyState = "complete"), a.dispatchEvent(n(a.import ? "load" : "error", {
                bubbles: !1,
                cancelable: !1,
                detail: void 0
            })))
        };
        l.prototype.C = function(a) {
            for (var b = 0; b < a.length; b++) {
                var c = a[b];
                if (c.addedNodes)
                    for (var d = 0; d < c.addedNodes.length; d++) {
                        var e = c.addedNodes[d];
                        e && e.nodeType === Node.ELEMENT_NODE && (u(e) ? this.o(e) : this.f(e))
                    }
            }
        };
        if (z) {
            for (var r = document.querySelectorAll("link[rel=import]"), C = 0,
                K = r.length, y; C < K && (y = r[C]); C++)
                y.import && "loading" === y.import.readyState || (y.__loaded = !0);
            r = function(a) {
                a = a.target;
                u(a) && (a.__loaded = !0)
            };
            document.addEventListener("load", r, !0);
            document.addEventListener("error", r, !0)
        } else {
            var t = Object.getOwnPropertyDescriptor(Node.prototype, "baseURI");
            Object.defineProperty((!t || t.configurable ? Node : Element).prototype, "baseURI", {
                get: function() {
                    var a = u(this) ? this : k(this);
                    return a ? a.href : t && t.get ? t.get.call(this) : (document.querySelector("base") || window.location).href
                },
                configurable: !0,
                enumerable: !0
            });
            q(function() {
                return new l
            })
        }
        p(function() {
            return document.dispatchEvent(n("HTMLImportsLoaded", {
                cancelable: !0,
                bubbles: !0,
                detail: void 0
            }))
        });
        m.useNative = z;
        m.whenReady = p;
        m.importForElement = k
    })(window.HTMLImports = window.HTMLImports || {});
    (function() {
        var m = window.customElements,
            n = window.HTMLImports;
        window.WebComponents = window.WebComponents || {};
        if (m && m.polyfillWrapFlushCallback) {
            var k,
                v = function() {
                    if (k) {
                        var p = k;
                        k = null;
                        p();
                        return !0
                    }
                },
                q = n.whenReady;
            m.polyfillWrapFlushCallback(function(p) {
                k = p;
                q(v)
            });
            n.whenReady = function(k) {
                q(function() {
                    v() ? n.whenReady(k) : k()
                })
            }
        }
        n.whenReady(function() {
            requestAnimationFrame(function() {
                window.WebComponents.ready = !0;
                document.dispatchEvent(new CustomEvent("WebComponentsReady", {
                    bubbles: !0
                }))
            })
        })
    })();
    var E = document.createElement("style");
    E.textContent = "body {transition: opacity ease-in 0.2s; } \nbody[unresolved] {opacity: 0; display: block; overflow: hidden; position: relative; } \n";
    var F = document.querySelector("head");
    F.insertBefore(E, F.firstChild);
}).call(self)
//# sourceMappingURL=webcomponents-hi.js.map
