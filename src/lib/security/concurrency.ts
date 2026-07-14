type ActiveReviewState = Map<string, symbol>;

const globalState = globalThis as typeof globalThis & {
  __secondLabActiveReviews?: ActiveReviewState;
};

function getActiveReviews() {
  if (!globalState.__secondLabActiveReviews) {
    globalState.__secondLabActiveReviews = new Map();
  }
  return globalState.__secondLabActiveReviews;
}

export type ReviewLease = {
  acquired: boolean;
  release: () => void;
};

export function acquireReviewLease(sessionId: string): ReviewLease {
  const activeReviews = getActiveReviews();
  if (activeReviews.has(sessionId)) {
    return { acquired: false, release: () => undefined };
  }

  const leaseId = Symbol(sessionId);
  activeReviews.set(sessionId, leaseId);
  let released = false;

  return {
    acquired: true,
    release() {
      if (released) return;
      released = true;
      if (activeReviews.get(sessionId) === leaseId) activeReviews.delete(sessionId);
    },
  };
}
