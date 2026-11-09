import API from "./api";

const okAdapter = (config) =>
  Promise.resolve({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/login");
});

test("sends the saved token as a Bearer header", async () => {
  localStorage.setItem("token", "abc123");
  let sentConfig;

  await API.get("/expenses", {
    adapter: (config) => {
      sentConfig = config;
      return okAdapter(config);
    },
  });

  expect(sentConfig.headers.Authorization).toBe("Bearer abc123");
});

test("sends no Authorization header when logged out", async () => {
  let sentConfig;

  await API.get("/expenses", {
    adapter: (config) => {
      sentConfig = config;
      return okAdapter(config);
    },
  });

  expect(sentConfig.headers.Authorization).toBeUndefined();
});

test("a 401 response clears the saved session", async () => {
  localStorage.setItem("token", "expired");
  localStorage.setItem("user", "{}");

  await expect(
    API.get("/expenses", {
      adapter: (config) =>
        Promise.reject({ config, response: { status: 401, data: {} } }),
    }),
  ).rejects.toBeDefined();

  expect(localStorage.getItem("token")).toBeNull();
  expect(localStorage.getItem("user")).toBeNull();
});
