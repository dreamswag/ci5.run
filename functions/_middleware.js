export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const userAgent = request.headers.get("User-Agent") || "";

  // Only intercept the root path "/"
  if (url.pathname === "/") {
    // If the visitor is curl or wget...
    if (userAgent.toLowerCase().startsWith("curl") || userAgent.toLowerCase().startsWith("wget")) {
      // ...serve them the installer script instead of the website.
      const stubUrl = new URL("/stub.sh", request.url);
      return context.env.ASSETS.fetch(stubUrl);
    }
  }

  // Everyone else (Browsers) gets the normal website
  return context.next();
}
