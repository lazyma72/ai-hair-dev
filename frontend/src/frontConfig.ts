const urlSearchParams = new URLSearchParams(window.location.search);

const envParam = urlSearchParams.get("env") ?? "";

const env: "local" | "dev" | "test" | "prod" =
  envParam === "local"
    ? "local"
    : envParam === "dev"
      ? "dev"
      : envParam === "test"
        ? "test"
        : "prod";

export const isDebug = localStorage.debug === "kingworks" || env !== "prod";

const serverUrl: { [K in typeof env]: string } = {
  local: "http://localhost:3000",
  dev: "http://127.0.0.1:3000/dev",
  test: "http://localhost:3000",
  prod: "http://localhost:3000",
};

export const frontConfig = {
  env,
  version: 22,
  apiServer: serverUrl[env],
  /** 静态资源 base URL，用于拼接上传文件路径 */
  staticBase: serverUrl[env],
};
