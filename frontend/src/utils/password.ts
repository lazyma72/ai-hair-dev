/**
 * 使用浏览器内置 Web Crypto API 对密码做 SHA-256，
 * 明文密码不会以任何形式离开浏览器。
 */
export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
