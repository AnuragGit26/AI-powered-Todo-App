"use strict";
(function () {
    var statusText = document.getElementById("statusText");
    var quipText = document.getElementById("quipText");
    var mascotBadge = document.getElementById("mascotBadge");
    var mascotIcon = document.getElementById("offlineMascot");
    var onlinePill = document.getElementById("onlinePill");
    var swStatus = document.getElementById("swStatus");
    function randomQuip() {
        var quips = [
            "Our Wi‑Fi goblin unplugged the cable.",
            "The internet stepped out for coffee.",
            "Packets went on a snack break 🍪",
            "Router is shy today. Be gentle.",
            "Cables are practicing social distancing.",
            "Your connection is doing the cha‑cha somewhere else."
        ];
        return quips[Math.floor(Math.random() * quips.length)];
    }
    function setStatus(msg) {
        if (statusText) statusText.textContent = msg;
    }
    function updateOnlineStatus() {
        var online = navigator.onLine;
        setStatus(online ? "Online — you can reload the app." : "Waiting for connection…");
        if (quipText) {
            quipText.textContent = online ? "Back online — high‑five ✋" : randomQuip();
        }
        if (onlinePill) {
            onlinePill.classList.toggle("ok", online);
            onlinePill.classList.toggle("warn", !online);
            onlinePill.classList.add("pop");
            var label = online ? "Back online — high‑five ✋" : "Offline — unplugged";
            var icon = online
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A2 2 0 0 0 3.53 22h16.94a2 2 0 0 0 1.72-3.44l-8.48-14.7a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            onlinePill.innerHTML = icon + "<span>" + label + "</span>";
            onlinePill.addEventListener("animationend", function handler() {
                onlinePill.classList.remove("pop");
                onlinePill.removeEventListener("animationend", handler);
            });
        }
        if (swStatus) {
            swStatus.classList.toggle("success", online);
            swStatus.classList.toggle("warn", !online);
            swStatus.innerHTML = online
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Ready for offline'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A2 2 0 0 0 3.53 22h16.94a2 2 0 0 0 1.72-3.44l-8.48-14.7a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Offline mode';
        }
        if (mascotBadge) {
            if (online) {
                mascotBadge.classList.add("online", "pop");
                mascotBadge.classList.remove("wiggle");
                // remove pop after it finishes so it can replay next time
                mascotBadge.addEventListener("animationend", function handler() {
                    mascotBadge.classList.remove("pop");
                    mascotBadge.removeEventListener("animationend", handler);
                });
            } else {
                mascotBadge.classList.remove("online");
                mascotBadge.classList.add("wiggle");
            }
        }
        if (mascotIcon) {
            // no-op for now; kept for potential future icon swaps
        }
    }
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
    var retry = document.getElementById("retry");
    if (retry) {
        retry.addEventListener("click", function () {
            // Attempt a lightweight request to test connectivity, then reload
            var url = "/favicon.svg";
            var controller = new AbortController();
            var t = setTimeout(function () {
                controller.abort();
            }, 3500);
            fetch(url, { cache: "no-store", signal: controller.signal })
                .then(function () {
                    clearTimeout(t);
                    location.replace("/");
                })
                .catch(function () {
                    // Still offline: just try reloading current page
                    location.reload();
                });
        });
    }
})();


