var ws = new WebSocket("ws://localhost:7999/connect");
ws.onmessage = function(event) {
    console.log("Received:", event.data);
};
ws.onopen = function(event) {
    ws.send("Hello, server!");
};
