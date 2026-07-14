import { describe, it, expect } from "vitest";
import { parseGithubUsername, normalizeGithubProfile } from "./github";

describe("parseGithubUsername", () => {
  it("profil URL'inden kullanıcı adını çıkarır", () => {
    expect(parseGithubUsername("https://github.com/gaearon")).toBe("gaearon");
    expect(parseGithubUsername("https://www.github.com/vercel/")).toBe("vercel");
  });

  it("repo/alt-yol/rezerve yolları reddeder", () => {
    expect(parseGithubUsername("https://github.com/facebook/react")).toBeNull();
    expect(parseGithubUsername("https://github.com/settings")).toBeNull();
    expect(parseGithubUsername("https://gitlab.com/user")).toBeNull();
    expect(parseGithubUsername("not-a-url")).toBeNull();
  });
});

const user = {
  login: "octodev", name: "Octo Dev", bio: "Building developer tools",
  company: "@acme", blog: "https://octo.dev", location: "Berlin",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  public_repos: 42, followers: 1200,
};
const repos = [
  { name: "cool-lib", description: "A cool TS library", language: "TypeScript", stargazers_count: 900, fork: false, topics: ["cli", "typescript"], html_url: "https://github.com/octodev/cool-lib" },
  { name: "web-app", description: "A React web app", language: "TypeScript", stargazers_count: 300, fork: false, topics: ["react", "nextjs"], html_url: "https://github.com/octodev/web-app" },
  { name: "py-tool", description: "Python helper", language: "Python", stargazers_count: 50, fork: false, topics: [], html_url: "https://github.com/octodev/py-tool" },
  { name: "someones-repo", description: "not mine", language: "Go", stargazers_count: 9999, fork: true, topics: [], html_url: "https://github.com/octodev/someones-repo" },
];

describe("normalizeGithubProfile", () => {
  it("repo dil+topic'lerinden beceri, öne çıkan repo'lardan proje türetir", () => {
    const p = normalizeGithubProfile(user, repos, "octodev");
    expect(p).not.toBeNull();
    // Fork'lar hariç: Go (9999 yıldızlı fork) becerilere/projeye GİRMEZ.
    expect(p!.draft.skills).toContain("TypeScript");
    expect(p!.draft.skills).toContain("Python");
    expect(p!.draft.skills).not.toContain("Go");
    // İlk dil (frekans) TypeScript → headline bio'dan gelir.
    expect(p!.draft.headline).toBe("Building developer tools");
    // Projeler yıldıza göre sıralı, fork hariç, en fazla 6.
    expect(p!.projects.map((x) => x.title)).toEqual(["cool-lib", "web-app", "py-tool"]);
    expect(p!.projects[0]).toMatchObject({ platform: "github", skills: ["TypeScript", "cli", "typescript"] });
    expect(p!.avatarUrl).toBe("https://avatars.githubusercontent.com/u/1?v=4");
    expect(p!.draft.summary).toContain("42 public repos");
  });

  it("bio yoksa headline isim + baskın dilden kurulur", () => {
    const p = normalizeGithubProfile({ ...user, bio: null }, repos, "octodev");
    expect(p!.draft.headline).toBe("Octo Dev · TypeScript Developer");
  });

  it("geçersiz user'da null döner", () => {
    expect(normalizeGithubProfile(null, [], "x")).toBeNull();
  });
});
