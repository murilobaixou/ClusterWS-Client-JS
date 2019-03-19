var ClusterWS = function() {
    "use strict";
    function t(t) {
        return console.log(t);
    }
    function e(t) {
        for (var e = t.length, n = new Uint8Array(e), o = 0; o < e; o++) n[o] = t.charCodeAt(o);
        return n.buffer;
    }
    var n = function() {
        function e(t, e) {
            this.name = e, this.socket = t, this.subscribe();
        }
        return e.prototype.watch = function(e) {
            return "[object Function]" !== {}.toString.call(e) ? t("Listener must be a function") : (this.listener = e, 
            this);
        }, e.prototype.publish = function(t) {
            return this.socket.send(this.name, t, "publish"), this;
        }, e.prototype.unsubscribe = function() {
            this.socket.send("unsubscribe", this.name, "system"), this.socket.channels[this.name] = null;
        }, e.prototype.onMessage = function(t) {
            this.listener && this.listener.call(null, t);
        }, e.prototype.subscribe = function() {
            this.socket.send("subscribe", this.name, "system");
        }, e;
    }(), o = function() {
        function e() {
            this.events = {};
        }
        return e.prototype.on = function(e, n) {
            if ("[object Function]" !== {}.toString.call(n)) return t("Listener must be a function");
            this.events[e] = n;
        }, e.prototype.off = function(t) {
            delete this.events[t];
        }, e.prototype.emit = function(t) {
            for (var e, n = [], o = 1; o < arguments.length; o++) n[o - 1] = arguments[o];
            this.events[t] && (e = this.events)[t].apply(e, n);
        }, e.prototype.removeAllEvents = function() {
            this.events = {};
        }, e;
    }();
    function s(t, e, n) {
        var o = {
            emit: {
                "#": [ "e", t, e ]
            },
            publish: {
                "#": [ "p", t, e ]
            },
            system: {
                subscribe: {
                    "#": [ "s", "s", e ]
                },
                unsubscribe: {
                    "#": [ "s", "u", e ]
                }
            }
        };
        return JSON.stringify("system" === n ? o[n][t] : o[n]);
    }
    var i = window.MozWebSocket || window.WebSocket;
    return function() {
        function c(n) {
            return this.events = new o(), this.channels = {}, this.pong = e("A"), this.reconnectionAttempted = 0, 
            this.hasStartedConnection = !1, this.options = {
                url: n.url,
                autoReconnect: n.autoReconnect || !1,
                autoReconnectOptions: n.autoReconnectOptions ? {
                    attempts: n.autoReconnectOptions.attempts || 0,
                    minInterval: n.autoReconnectOptions.minInterval || 1e3,
                    maxInterval: n.autoReconnectOptions.maxInterval || 5e3
                } : {
                    attempts: 0,
                    minInterval: 1e3,
                    maxInterval: 5e3
                },
                encodeDecodeEngine: n.encodeDecodeEngine || !1,
                autoConnect: !1 !== n.autoConnect,
                autoResubscribe: !1 !== n.autoResubscribe
            }, this.options.url ? this.options.autoReconnectOptions.minInterval > this.options.autoReconnectOptions.maxInterval ? t("minInterval option can not be more than maxInterval option") : void (this.options.autoConnect && this.create()) : t("Url must be provided and it must be a string");
        }
        return c.prototype.on = function(t, e) {
            this.events.on(t, e);
        }, c.prototype.off = function(t) {
            this.events.off(t);
        }, c.prototype.getState = function() {
            return this.websocket ? this.websocket.readyState : 0;
        }, c.prototype.resetPing = function(t) {
            var e = this;
            t && (this.pingInterval = t), clearTimeout(this.pingTimeout), this.pingTimeout = setTimeout(function() {
                return e.disconnect(4001, "Did not get pings");
            }, 2 * this.pingInterval + 100);
        }, c.prototype.disconnect = function(t, e) {
            this.websocket.close(t || 1e3, e);
        }, c.prototype.send = function(t, n, o) {
            void 0 === o && (o = "emit"), n = this.options.encodeDecodeEngine ? this.options.encodeDecodeEngine.encode(n) : n, 
            this.websocket.send(this.useBinary ? e(s(t, n, o)) : s(t, n, o));
        }, c.prototype.subscribe = function(t) {
            return this.channels[t] ? this.channels[t] : this.channels[t] = new n(this, t);
        }, c.prototype.getChannelByName = function(t) {
            return this.channels[t];
        }, c.prototype.connect = function() {
            this.hasStartedConnection ? t("The socket has already been created") : this.create();
        }, c.prototype.create = function() {
            var e = this;
            this.hasStartedConnection = !0, this.websocket = new i(this.options.url), this.websocket.binaryType = "arraybuffer", 
            this.websocket.onopen = function() {
                if (e.reconnectionAttempted = 0, e.options.autoResubscribe) for (var t = 0, n = Object.keys(e.channels), o = n.length; t < o; t++) e.channels.hasOwnProperty(n[t]) && e.channels[n[t]].subscribe();
            }, this.websocket.onclose = function(t) {
                if (e.options.autoResubscribe || (e.channels = {}), clearTimeout(e.pingTimeout), 
                e.events.emit("disconnect", t.code, t.reason), e.options.autoReconnect && 1e3 !== t.code && (0 === e.options.autoReconnectOptions.attempts || e.reconnectionAttempted < e.options.autoReconnectOptions.attempts)) e.websocket.readyState === e.websocket.CLOSED ? (e.reconnectionAttempted++, 
                e.websocket = void 0, setTimeout(function() {
                    return e.create();
                }, Math.floor(Math.random() * (e.options.autoReconnectOptions.maxInterval - e.options.autoReconnectOptions.minInterval + 1)))) : console.log("Some thing went wrong with close event please contact developer"); else {
                    e.events.removeAllEvents();
                    for (var n = 0, o = Object.keys(e), s = o.length; n < s; n++) e[o[n]] = null;
                }
            }, this.websocket.onmessage = function(n) {
                var o;
                if (57 === (o = n.data ? "string" != typeof n.data ? new Uint8Array(n.data) : n.data : "string" != typeof n ? new Uint8Array(n) : n)[0]) return e.websocket.send(e.pong), 
                e.resetPing();
                try {
                    !function(t, e) {
                        var n = t.options.encodeDecodeEngine ? t.options.encodeDecodeEngine.decode(e["#"][2]) : e["#"][2], o = {
                            e: function() {
                                return t.events.emit(e["#"][1], n);
                            },
                            p: function() {
                                return t.channels[e["#"][1]] && t.channels[e["#"][1]].onMessage(n);
                            },
                            s: {
                                c: function() {
                                    t.useBinary = n.binary, t.resetPing(n.ping), t.events.emit("connect");
                                }
                            }
                        };
                        "s" === e["#"][0] ? o[e["#"][0]][e["#"][1]] && o[e["#"][0]][e["#"][1]]() : o[e["#"][0]] && o[e["#"][0]]();
                    }(e, JSON.parse("string" == typeof o ? o : function(t) {
                        for (var e = "", n = 65535, o = t.length, s = 0; s < o; s += n) s + n > o && (n = o - s), 
                        e += String.fromCharCode.apply(null, t.subarray(s, s + n));
                        return e;
                    }(o)));
                } catch (e) {
                    return t(e);
                }
            }, this.websocket.onerror = function(t) {
                return e.events.emit("error", t);
            };
        }, c;
    }();
}();
