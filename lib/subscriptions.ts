/**
 * Maps Polar subscription ids to our anonymous user ids.
 *
 * Polar's checkout payload includes `customer_external_id` (the anonymous
 * uid we sent), so this is mostly a safety net / lookup table for cases
 * where we only have a subscription id (e.g. cancelation webhooks).
 */
class SubscriptionMap {
  /** subscriptionId → userId */
  private subToUser: Map<string, string> = new Map();

  remember(subscriptionId: string, userId: string): void {
    this.subToUser.set(subscriptionId, userId);
  }

  getUserId(subscriptionId: string): string | undefined {
    return this.subToUser.get(subscriptionId);
  }

  forget(subscriptionId: string): void {
    this.subToUser.delete(subscriptionId);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prankoSubMap: SubscriptionMap | undefined;
}

export const subscriptionMap: SubscriptionMap =
  globalThis.__prankoSubMap ??
  (globalThis.__prankoSubMap = new SubscriptionMap());
