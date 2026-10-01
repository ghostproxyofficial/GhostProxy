// epoxy wrapper for bare-mux v2. lives in public/ so the obfuscator skips it
// and baremux's SharedWorker picks it up via dynamic import().
// three header shape mismatches get fixed here: baremux sends {k: v} but epoxy
// wants an iterable, epoxy hands back [[k, v]] but baremux wants {k: [v]}, and
// epoxy keeps the original casing while scramjet looks up lowercase names.
import EpoxyTransport from "../epoxy-raw/index.mjs";

function toIterable(headers) {
  if (!headers) return [];
  if (typeof headers[Symbol.iterator] === "function") return headers;
  if (typeof headers.entries === "function") return headers.entries();
  return Object.entries(headers);
}

function pairsToObj(headers) {
  if (!Array.isArray(headers)) return headers;
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var entry = headers[i];
    if (!Array.isArray(entry)) return headers;
    var key = entry[0].toLowerCase();
    var val = entry[1];
    if (!obj[key]) obj[key] = [val];
    else obj[key].push(val);
  }
  return obj;
}

// servers send GOAWAY to recycle connections and epoxy treats it as fatal
// instead of retrying, so catch that and try a fresh connection
var GOAWAY_RE = /GoAway|GOAWAY|Http2/i;
var MAX_RETRIES = 2;

class PatchedEpoxyTransport extends EpoxyTransport {
  async request(remote, method, body, headers, signal) {
    var iterableHeaders = toIterable(headers);
    for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        var res = await super.request(remote, method, body, iterableHeaders, signal);
        if (res && res.headers) res.headers = pairsToObj(res.headers);
        return res;
      } catch (err) {
        var msg = String(err && err.message || err);
        if (attempt < MAX_RETRIES && GOAWAY_RE.test(msg)) {
          /* short pause so the wasm transport can recycle the connection */
          await new Promise(function (r) { setTimeout(r, 150 * (attempt + 1)); });
          continue;
        }
        throw err;
      }
    }
  }

  connect(url, protocols, requestHeaders, onopen, onmessage, onclose, onerror) {
    return super.connect(
      url,
      protocols,
      toIterable(requestHeaders),
      onopen,
      onmessage,
      onclose,
      onerror
    );
  }
}

export default PatchedEpoxyTransport;
