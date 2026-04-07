const urlSearchParams = new URLSearchParams(window.location.search);

const env =
  urlSearchParams.get("env") ||
  (window.location.href.includes("://localhost")
    ? "local"
    : window.location.href.includes(":4999/")
      ? "local"
      : window.location.href.includes("/dev/")
        ? "dev"
        : window.location.href.includes("/test/")
          ? "test"
          : "prod");

export const isDebug = localStorage.debug === "kingworks" || env !== "prod";

const serverUrl: { [K in typeof env]: string } = {
  // local: `${location.protocol}//${location.hostname}:3000/`,
  local: "https://event.bytedance.com/api/dev/byte-studio/",
  // dev: "http://localhost:3000/",
  dev: "https://event.bytedance.com/api/dev/byte-studio/",
  test: "https://event.bytedance.com/api/test/byte-studio/",
  prod: "https://event.bytedance.com/api/byte-studio/",
};

// const shareUrl: { [K in typeof env]: string } = {
//   local: `http://localhost:3000`,
//   dev: `https://event.bytedance.com/test/byte-studio/feedback/index.html?page=survey&env=dev`,
//   test: `https://event.bytedance.com/test/byte-studio/feedback/index.html?page=survey&env=test`,
//   prod: `https://event.bytedance.com/byte-studio/feedback/index.html?page=survey`,
// }

export const frontConfig = {
  env,
  version: 22,
  apiServer: serverUrl[env],
};
