/** Hostname checks for GitHub test doubles. Do not match substrings in the URL. */

export function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export function requestHostname(input: RequestInfo | URL): string {
  try {
    return new URL(requestUrl(input)).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isGitHubReposApi(input: RequestInfo | URL): boolean {
  try {
    const url = new URL(requestUrl(input));
    return (
      url.hostname.toLowerCase() === "api.github.com" &&
      url.pathname.includes("/repos/")
    );
  } catch {
    return false;
  }
}

export function isGitHubApiHost(input: RequestInfo | URL): boolean {
  return requestHostname(input) === "api.github.com";
}

export function isCodeloadHost(input: RequestInfo | URL): boolean {
  return requestHostname(input) === "codeload.github.com";
}
