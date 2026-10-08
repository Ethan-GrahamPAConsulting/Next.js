describe("frontend Jest environment", () => {
  test("provides a browser-like DOM", () => {
    expect(typeof window).toBe("object");
    expect(document.createElement("div")).toBeInstanceOf(HTMLElement);
  });
});