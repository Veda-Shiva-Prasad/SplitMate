// jest-dom adds custom matchers such as toBeInTheDocument().
import "@testing-library/jest-dom";

// react-router v7 needs TextEncoder/TextDecoder, which Create React App's
// older jsdom test environment does not provide.
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
