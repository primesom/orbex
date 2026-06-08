import { beforeEach, describe, expect, test } from "@orbex/hoot";
import { getService, makeMockEnv } from "@web/../tests/web_test_helpers";

describe.current.tags("headless");

let titleService;

beforeEach(async () => {
    await makeMockEnv();
    titleService = getService("title");
});

test("simple title", () => {
    titleService.setParts({ one: "MyOrbex" });
    expect(titleService.current).toBe("MyOrbex");
});

test("add title part", () => {
    titleService.setParts({ one: "MyOrbex", two: null });
    expect(titleService.current).toBe("MyOrbex");
    titleService.setParts({ three: "Import" });
    expect(titleService.current).toBe("MyOrbex - Import");
});

test("modify title part", () => {
    titleService.setParts({ one: "MyOrbex" });
    expect(titleService.current).toBe("MyOrbex");
    titleService.setParts({ one: "Zopenerp" });
    expect(titleService.current).toBe("Zopenerp");
});

test("delete title part", () => {
    titleService.setParts({ one: "MyOrbex" });
    expect(titleService.current).toBe("MyOrbex");
    titleService.setParts({ one: null });
    expect(titleService.current).toBe("Orbex");
});

test("all at once", () => {
    titleService.setParts({ one: "MyOrbex", two: "Import" });
    expect(titleService.current).toBe("MyOrbex - Import");
    titleService.setParts({ one: "Zopenerp", two: null, three: "Sauron" });
    expect(titleService.current).toBe("Zopenerp - Sauron");
});

test("get title parts", () => {
    expect(titleService.current).toBe("");
    titleService.setParts({ one: "MyOrbex", two: "Import" });
    expect(titleService.current).toBe("MyOrbex - Import");
    const parts = titleService.getParts();
    expect(parts).toEqual({ one: "MyOrbex", two: "Import" });
    parts.action = "Export";
    expect(titleService.current).toBe("MyOrbex - Import"); // parts is a copy!
});
