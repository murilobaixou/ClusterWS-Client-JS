var ClusterWS = function() {
    "use strict";
    function t(t) {
        return console.log(t);
    }
    var n = function() {
        function n(t, n) {
            this.socket = t, this.name = n, this.subscribe();
        }
        return n.prototype.watch = function(n) {
            return "[object Function]" !== {}.toString.call(n) ? t("Listener must be a function") : (this.listener = n, 
            this);
        }, n.prototype.publish = function(t) {
            return this.socket.send(this.name, t, "publish"), this;
        }, n.prototype.unsubscribe = function() {
            this.socket.send("unsubscribe", this.name, "system"), this.socket.channels[this.name] = null;
        }, n.prototype.onMessage = function(t) {
            this.listener && this.listener.call(null, t);
        }, n.prototype.subscribe = function() {
            this.socket.send("subscribe", this.name, "system");
        }, n;
    }(), e = function() {
        function n() {
            this.events = {};
        }
        return n.prototype.on = function(n, e) {
            if ("[object Function]" !== {}.toString.call(e)) return t("Listener must be a function");
            this.events[n] = e;
        }, n.prototype.emit = function(t) {
            for (var n = [], e = 1; e < arguments.length; e++) n[e - 1] = arguments[e];
            this.events[t] && (o = this.events[t]).call.apply(o, [ null ].concat(n));
            var o;
        }, n.prototype.removeAllEvents = function() {
            this.events = {};
        }, n;
    }(), o = function() {
        function t(t) {
            this.socket = t, this.inReconnectionState = !1, this.reconnectionAttempted = 0, 
            this.autoReconnect = this.socket.options.autoReconnect;
        }
        return t.prototype.isConnected = function() {
            clearTimeout(this.timer), clearInterval(this.interval), this.inReconnectionState = !1, 
            this.reconnectionAttempted = 0;
            for (var t in this.socket.channels) this.socket.channels[t] && this.socket.channels[t].subscribe();
        }, t.prototype.reconnect = function() {
            var t = this;
            this.inReconnectionState || (this.inReconnectionState = !0, this.interval = setInterval(function() {
                t.socket.getState() === t.socket.websocket.CLOSED && (t.reconnectionAttempted++, 
                0 !== t.socket.options.reconnectionAttempts && t.reconnectionAttempted >= t.socket.options.reconnectionAttempts && (clearInterval(t.interval), 
                t.autoReconnect = !1, t.inReconnectionState = !1), clearTimeout(t.timer), t.timer = setTimeout(function() {
                    return t.socket.create();
                }, Math.floor(Math.random() * (t.socket.options.reconnectionIntervalMax - t.socket.options.reconnectionIntervalMin + 1))));
            }, this.socket.options.reconnectionIntervalMin));
        }, t;
    }();
    function i(t, n, e) {
        switch (e) {
          case "ping":
            return t;

          case "emit":
            return JSON.stringify({
                "#": [ "e", t, n ]
            });

          case "publish":
            return JSON.stringify({
                "#": [ "p", t, n ]
            });

          case "system":
            switch (t) {
              case "subscribe":
                return JSON.stringify({
                    "#": [ "s", "s", n ]
                });

              case "unsubscribe":
                return JSON.stringify({
                    "#": [ "s", "u", n ]
                });

              case "configuration":
                return JSON.stringify({
                    "#": [ "s", "c", n ]
                });
            }
        }
    }
    return function() {
        function s(n) {
            return this.channels = {}, this.events = new e(), this.missedPing = 0, this.useBinary = !1, 
            n.url ? (this.options = {
                url: n.url,
                autoReconnect: n.autoReconnect || !1,
                reconnectionAttempts: n.reconnectionAttempts || 0,
                reconnectionIntervalMin: n.reconnectionIntervalMin || 1e3,
                reconnectionIntervalMax: n.reconnectionIntervalMax || 5e3
            }, this.options.reconnectionIntervalMin > this.options.reconnectionIntervalMax ? t("reconnectionIntervalMin can not be more then reconnectionIntervalMax") : (this.reconnection = new o(this), 
            void this.create())) : t("Url must be provided and it must be string");
        }
        return s.prototype.create = function() {
            var n = this, e = window.MozWebSocket || window.WebSocket;
            this.websocket = new e(this.options.url), this.websocket.binaryType = "arraybuffer", 
            this.websocket.onopen = function() {
                return n.reconnection.isConnected();
            }, this.websocket.onerror = function(t) {
                return n.events.emit("error", t.message);
            }, this.websocket.onmessage = function(e) {
                var o = "string" != typeof e.data ? String.fromCharCode.apply(null, new Uint8Array(e.data)) : e.data;
                if ("#0" === o) return n.missedPing = 0, n.send("#1", null, "ping");
                try {
                    o = JSON.parse(o);
                } catch (n) {
                    return t(n);
                }
                !function(t, n) {
                    switch (n["#"][0]) {
                      case "e":
                        return t.events.emit(n["#"][1], n["#"][2]);

                      case "p":
                        t.channels[n["#"][1]] && t.channels[n["#"][1]].onMessage(n["#"][2]);

                      case "s":
                        switch (n["#"][1]) {
                          case "c":
                            t.pingInterval = setInterval(function() {
                                return t.missedPing++ > 2 && t.disconnect(4001, "Did not get pings");
                            }, n["#"][2].ping), t.useBinary = n["#"][2].binary, t.events.emit("connect");
                        }
                    }
                }(n, o);
            }, this.websocket.onclose = function(t) {
                if (n.missedPing = 0, clearInterval(n.pingInterval), n.events.emit("disconnect", t.code, t.reason), 
                n.options.autoReconnect && 1e3 !== t.code) return n.reconnection.reconnect();
                n.events.removeAllEvents();
                for (var e in n) n[e] && (n[e] = null);
            };
        }, s.prototype.on = function(t, n) {
            this.events.on(t, n);
        }, s.prototype.send = function(t, n, e) {
            void 0 === e && (e = "emit"), this.websocket.send(this.useBinary ? function(t) {
                for (var n = t.length, e = new Uint8Array(n), o = 0; o < n; o++) e[o] = t.charCodeAt(o);
                return e.buffer;
            }(i(t, n, e)) : i(t, n, e));
        }, s.prototype.disconnect = function(t, n) {
            this.websocket.close(t || 1e3, n);
        }, s.prototype.getState = function() {
            return this.websocket.readyState;
        }, s.prototype.subscribe = function(t) {
            return this.channels[t] ? this.channels[t] : this.channels[t] = new n(this, t);
        }, s.prototype.getChannelByName = function(t) {
            return this.channels[t];
        }, s;
    }();
}();