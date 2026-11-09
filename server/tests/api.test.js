const request = require("supertest");
const jwt = require("jsonwebtoken");

// Replace only the User model so these tests never need a database.
jest.mock("../models/User", () => ({ findById: jest.fn(), findOne: jest.fn() }));

const User = require("../models/User");
const app = require("../app");

const USER_ID = "64b7f0c2a1b2c3d4e5f60718";
const token = jwt.sign({ id: USER_ID }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
const auth = { Authorization: `Bearer ${token}` };

beforeEach(() => {
  User.findById.mockReset();
  User.findById.mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: USER_ID, id: USER_ID, name: "Test" }),
  });
});

describe("health and routing", () => {
  test("GET / reports the API is running", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/running/i);
  });

  test("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("unknown API route returns 404 JSON", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test("malformed JSON returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
  });

  test("a disallowed CORS origin is rejected", async () => {
    const res = await request(app).get("/").set("Origin", "https://evil.example");
    expect(res.status).toBe(403);
  });

  test("security headers are set", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("authentication is required", () => {
  const protectedRoutes = [
    "/api/expenses",
    "/api/budgets",
    "/api/goals",
    "/api/owed",
    "/api/recurring",
    "/api/categories",
    "/api/groups",
    "/api/auth/me",
  ];

  test.each(protectedRoutes)("GET %s without a token is 401", async (route) => {
    const res = await request(app).get(route);
    expect(res.status).toBe(401);
  });

  test("a token signed with the wrong secret is 401", async () => {
    const forged = jwt.sign({ id: USER_ID }, "some-other-secret-value-123456789");
    const res = await request(app)
      .get("/api/goals")
      .set("Authorization", `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test("a valid token for a deleted user is 401", async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get("/api/goals").set(auth);
    expect(res.status).toBe(401);
  });
});

describe("register and login validation", () => {
  test("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Veda", email: "not-an-email", password: "secret123" });
    expect(res.status).toBe(400);
  });

  test("rejects a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Veda", email: "veda@example.com", password: "123" });
    expect(res.status).toBe(400);
  });

  test("rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "veda@example.com", password: "secret123" });
    expect(res.status).toBe(400);
  });

  test("login with no credentials is 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("goals validation (no database needed)", () => {
  const future = "2030-01-01";

  test("create goal rejects a negative target", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set(auth)
      .send({ name: "Bike", target: -5, deadline: future });
    expect(res.status).toBe(400);
  });

  test("create goal rejects a target sent as text", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set(auth)
      .send({ name: "Bike", target: "5000", deadline: future });
    expect(res.status).toBe(400);
  });

  test("create goal rejects a missing deadline", async () => {
    const res = await request(app)
      .post("/api/goals")
      .set(auth)
      .send({ name: "Bike", target: 5000 });
    expect(res.status).toBe(400);
  });

  test("an invalid goal id is 400, not a 500 crash", async () => {
    const res = await request(app).delete("/api/goals/not-an-id").set(auth);
    expect(res.status).toBe(400);
  });

  test("adding a text amount to a goal is rejected", async () => {
    const res = await request(app)
      .post("/api/goals/64b7f0c2a1b2c3d4e5f60999/add")
      .set(auth)
      .send({ amount: "50" });
    expect(res.status).toBe(400);
  });

  test("adding a negative amount to a goal is rejected", async () => {
    const res = await request(app)
      .post("/api/goals/64b7f0c2a1b2c3d4e5f60999/add")
      .set(auth)
      .send({ amount: -50 });
    expect(res.status).toBe(400);
  });
});

describe("owed, categories, expenses and groups validation", () => {
  test("owed rejects a zero amount", async () => {
    const res = await request(app)
      .post("/api/owed")
      .set(auth)
      .send({ name: "Ravi", amount: 0 });
    expect(res.status).toBe(400);
  });

  test("owed rejects a missing name", async () => {
    const res = await request(app).post("/api/owed").set(auth).send({ amount: 100 });
    expect(res.status).toBe(400);
  });

  test("category rejects a bad color", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set(auth)
      .send({ name: "Gym", color: "red; drop table" });
    expect(res.status).toBe(400);
  });

  test("expense rejects a negative amount", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set(auth)
      .send({ description: "Lunch", amount: -10 });
    expect(res.status).toBe(400);
  });

  test("expense delete rejects an invalid id", async () => {
    const res = await request(app).delete("/api/expenses/xyz").set(auth);
    expect(res.status).toBe(400);
  });

  test("group rejects members that are not valid ids", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set(auth)
      .send({ name: "Trip", members: ["abc"] });
    expect(res.status).toBe(400);
  });

  test("group rejects a missing name", async () => {
    const res = await request(app).post("/api/groups").set(auth).send({});
    expect(res.status).toBe(400);
  });
});
