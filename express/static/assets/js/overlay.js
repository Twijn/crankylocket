let websocket;

let hideTimeout = null;

function initWebsocket() {
    websocket = new WebSocket("ws://localhost:3393/ws");

    websocket.onmessage = function(msg) {
        try {
            const data = JSON.parse(msg.data);
            
            if (data.type === "live-reaction") {
                $("#live-reaction").addClass("out");
                $("#live-reaction").show();

                $("#reaction-name").text(data.emote.displayName);
                $("#reaction-image").attr("src", data.emote.url);
                $("#reaction-count").text("x" + data.count);
                setTimeout(() => {
                    $("#live-reaction").removeClass("out");
                }, hideTimeout ? 75 : 5);

                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                }

                hideTimeout = setTimeout(() => {
                    hideTimeout = null;
                    $("#live-reaction").addClass("out");
                    setTimeout(() => {
                        $("#live-reaction").hide();
                    }, 250);
                }, 3500);
            }
        } catch(err) {
            console.error(err);
        }
    }

    websocket.onopen = function() {
        console.log("Websocket connected!");
        $("#inactive").hide();
    }

    websocket.onclose = function() {
        console.log("Websocket closed. Reconnecting...");
        initWebsocket();
        $("#inactive").fadeIn(50);
    }
}

initWebsocket();
