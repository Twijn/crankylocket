$(function() {

const WS_URI = "/ws";

let websocket;

let hideTimeout = null;

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

let roles = [];

function getRoles() {
    $.get("/json/roles", data => {
        roles = data;
        drawCanvas();
    })
}

const ctx = document.getElementById("wheel").getContext("2d");
const width = document.getElementById("wheel").width;
const center = width / 2;

function drawSlice(color, deg, sliceSize) {
    ctx.moveTo(center, center);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(center, center, center, deg2rad(deg), deg2rad(deg + sliceSize));
    ctx.lineTo(center, center);
    ctx.closePath();
    ctx.fill();
}

function drawText(deg, text, color) {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(deg2rad(deg));
    ctx.fillStyle = color;
    ctx.font = "20px Arial";
    ctx.fillText(text, 15, 10, center - 20);
    ctx.restore();
}

function drawCanvas() {
    let sliceSize = 360 / roles.length;
    let deg = 0;

    roles.forEach(role => {
        drawSlice(role.wheelColor, deg, sliceSize);
        drawText(deg + (sliceSize / 2), role.name, role.wheelTextColor);
        deg += sliceSize;
    })

}

function spinWheel(endDeg, cb) {
    // adds randomness on when the wheel starts to slow down.
    const rand = (Math.random() * .2) + .9;

    let deg = 0;
    let degDiff = 20;
    const interval = setInterval(() => {
        $("#wheel").css("transform",`rotate(${deg}deg)`);

        // endDeg has been reached. Clear the interval and call the callback
        if (deg >= endDeg) {
            cb();
            return clearInterval(interval);
        }
        deg += degDiff;

        // if the wheel is 7 * .9 to 7 * 1.1 (random) spins away from stopping, start slowing it down by
        // decrementing the degDiff value.
        if (endDeg - deg < 360 * 7 * rand) {
            degDiff = (endDeg - deg) / 360 / 6.75 * 20;
        }

        degDiff = Math.max(degDiff, .01);
    }, 5);
}

let wheelQueue = [];
let wheelSpinning = false;

function spinNextWheel() {
    const data = wheelQueue.shift();

    if (!data) return;

    wheelSpinning = true;

    $("#role-wheel").addClass("out");
    $("#role-wheel").show();
    $("#wheel").css("transform","rotate(0deg)");
    $("#role-wheel .username").text(data.user.displayName);
    setTimeout(() => {
        $("#role-wheel").removeClass("out");
    }, 10);
    setTimeout(() => {
        spinWheel(data.endDeg, () => {
            $("#role-wheel").addClass("out");
            $("#role-selected").addClass("out");
            $("#role-selected").show();
            $("#role-selected .user-image").attr("src", data.user.avatar);
            $("#role-selected .user-name").text(data.user.displayName);
            $("#role-selected .role").text(data.role.name);
            $("#role-selected .role").css("background-color", data.role.backgroundColor);
            $("#role-selected .role").css("color", data.role.textColor);
            setTimeout(() => {
                $("#role-selected").removeClass("out");
            }, 10);
            setTimeout(() => {
                $("#role-selected").addClass("out");
                setTimeout(() => {
                    $("#role-wheel").hide();
                    $("#role-selected").hide();

                    wheelSpinning = false;

                    if (wheelQueue.length > 0) {
                        spinNextWheel();
                    }
                }, 250);
            }, 5500);
        });
    }, 1500);
}

function initWebsocket() {
    websocket = new WebSocket(WS_URI);

    websocket.onmessage = function(msg) {
        try {
            const data = JSON.parse(msg.data);
            
            if (data.type === "live-reaction") {
                $("#reaction-name").text(data.emote.displayName);
                $("#reaction-image").attr("src", data.emote.url);
                $("#reaction-count").text("x" + data.count);

                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;

                    $("#live-reaction").addClass("bounce");

                    setTimeout(() => {
                        $("#live-reaction").removeClass("bounce");
                    }, 100);
                } else {
                    $("#live-reaction").addClass("out");
                    $("#live-reaction").show();

                    setTimeout(() => {
                        $("#live-reaction").removeClass("out");
                    }, 5);
                }

                hideTimeout = setTimeout(() => {
                    hideTimeout = null;
                    $("#live-reaction").addClass("out");
                    setTimeout(() => {
                        $("#live-reaction").hide();
                    }, 250);
                }, 3500);
            } else if (data.type === "role-wheel") {
                wheelQueue.push(data);

                // if there's only the current wheel spin in queue and the wheel is NOT spinning, start it immediately
                if (wheelQueue.length === 1 && !wheelSpinning) {
                    spinNextWheel();
                }
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
getRoles();

})
