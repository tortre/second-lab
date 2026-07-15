export type ReviewAvailability = {
  liveReview: boolean;
  accessRequired: boolean;
};

export type PreparedDemoEntry = "cached" | "live" | "request-access";

export function choosePreparedDemoEntry(availability: ReviewAvailability, forceCached = false): PreparedDemoEntry {
  if (forceCached) return "cached";
  if (!availability.liveReview) return "cached";
  return availability.accessRequired ? "request-access" : "live";
}
