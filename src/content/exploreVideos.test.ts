import { describe, expect, it } from "vitest";
import { BANDS, CONTRACTION_STEPS, formatTime, PARTS, SARCOMERE_VIDEO_NOTES, VIDEOS, videoHref, type VideoNote } from "./explore";
import { LEVELS } from "./exploreZoom";

const seconds = (len: string) => len.split(":").reduce((s, part) => s * 60 + Number(part), 0);

describe("sarcomere videos", () => {
  it("lists chapters in order, inside each video", () => {
    for (const v of Object.values(VIDEOS)) {
      const ats = v.chapters.map((c) => c.at);
      expect(ats).toEqual([...ats].sort((a, b) => a - b));
      expect(Math.max(...ats)).toBeLessThan(seconds(v.length));
    }
  });

  it("points every note and step link inside its video", () => {
    const notes: VideoNote[] = [
      ...PARTS.flatMap((p) => p.video ?? []),
      ...Object.values(BANDS).flatMap((b) => b.video ?? []),
      ...SARCOMERE_VIDEO_NOTES,
      ...LEVELS.flatMap((l) => l.hotspots.flatMap((h) => h.video ?? [])),
      ...CONTRACTION_STEPS.flatMap((s) => (s.video === undefined ? [] : [{ video: "crossbridge" as const, at: s.video, text: s.title }])),
    ];
    expect(notes.length).toBeGreaterThan(10);
    for (const n of notes) expect(n.at).toBeLessThan(seconds(VIDEOS[n.video].length));
  });

  it("formats times and links", () => {
    expect(formatTime(98)).toBe("1:38");
    expect(formatTime(5)).toBe("0:05");
    expect(videoHref({ video: "crossbridge", at: 98 })).toBe("/explore/sarcomere?video=crossbridge&t=98#video");
  });
});
