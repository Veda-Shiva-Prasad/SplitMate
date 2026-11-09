// Runs before every test file. Test-only values; never real secrets.
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.NODE_ENV = "test";
