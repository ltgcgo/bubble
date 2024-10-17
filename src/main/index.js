"use strict";

const cacheStaleMs = 60000;

let cachedMapLastUpdate = 0;
let cachedJson;
let getJson = async (key, env) => {
	if (Date.now() - cachedMapLastUpdate > cacheStaleMs) {
		console.debug(`Fetching JSON...`);
		cachedJson = await (await fetch(env["MAP_URL"])).json();
		cachedMapLastUpdate = Date.now();
		console.debug(`JSON loaded.`);
	};
	if (!cachedJson) {
		throw(new Error(`JSON not ready`));
	};
	return cachedJson[key];
};
let fetchJson = async (...args) => {
	return await (await fetch(...args)).json();
};

let handleRequest = async function (request, env) {
	let url = new URL(request.url);
	let searchMapRaw = url.search.substring(1).split("&");
	searchMapRaw.forEach((e, i, a) => {
		let arr = e.split("=");
		arr.forEach((e1, i1, a1) => {
			a1[i1] = decodeURIComponent(e1);
		});
		a[i] = arr;
	});
	let searchMap = new Map(searchMapRaw);
	if (!searchMap.has("resource")) {
		return new Response("Invalid WebFinger request", {
			status: 400
		});
	};
	let rscString = searchMap.get("resource");
	if (rscString.indexOf("acct:") != 0) {
		return new Response("Unsupported resource field", {
			status: 400
		})
	};
	let targetKey = rscString.substring(5);
	let data = await getJson(targetKey, env);
	if (data) {
		let newJsonData = await fetchJson(`https://${data[0]}/.well-known/webfinger?resource=acct:${data[1]}@${data[0]}`);
		newJsonData["subject"] = rscString;
		return new Response(JSON.stringify(newJsonData), {
			status: 200,
			headers: {
				"Content-Type": "application/json"
			}
		});
	} else {
		return new Response("Entity not found", {
			status: 404
		});
	};
};

let responseWrapper = async (req, env) => {
	try {
		return await handleRequest(req, env);
	} catch (err) {
		return new Response(`${err.stack}`, {
			status: 500
		});
	};
};

addEventListener("fetch", (event, env) => {
	event.respondWith(responseWrapper(event.request, self));
});

if (self.Deno) {
	Deno.serve((req) => {
		return responseWrapper(req, Deno.env.toObject());
	});
};
