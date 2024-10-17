"use strict";

let emptyBuffer = new Uint8Array(0);

let handleRequest = async function (request) {
	console.debug(request.url);
	return new Response(emptyBuffer, {
		status: 302,
		headers: {
			"Location": "https://ltgc.cc/"
		}
	})
};

addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event.request));
});
