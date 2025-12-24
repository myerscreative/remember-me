'use server';

import { getBloomingContacts } from "@/lib/dashboard/dashboardUtils";

export async function getBloomingContactsAction(limit: number = 10) {
  return await getBloomingContacts(limit);
}
