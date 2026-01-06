import { Person } from "@/types/database.types";

export type SortOption = "first_name" | "last_name" | "birthday" | "last_contact";
export type SortDirection = "asc" | "desc";

export function sortContacts(
  contacts: Person[],
  option: SortOption,
  direction: SortDirection = "asc"
): Person[] {
  return [...contacts].sort((a, b) => {
    let comparison = 0;

    switch (option) {
      case "first_name":
        comparison = (a.first_name || "").localeCompare(b.first_name || "");
        break;
      case "last_name":
        // Fallback to first name if last name is missing
        const aLast = a.last_name || a.first_name || "";
        const bLast = b.last_name || b.first_name || "";
        comparison = aLast.localeCompare(bLast);
        break;
      case "birthday":
        comparison = compareBirthdays(a.birthday, b.birthday);
        break;
      case "last_contact":
        comparison = compareDates(a.last_interaction_date, b.last_interaction_date);
        break;
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

function compareBirthdays(dateA: string | null, dateB: string | null): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1; // Nulls last
  if (!dateB) return -1;

  // Format YYYY-MM-DD. We want to sort by Month and Day only.
  // We can just grab the substring MM-DD and compare strictly, 
  // because "02-15" < "11-01" holds true lexically.
  const mmddA = dateA.slice(5); // "MM-DD"
  const mmddB = dateB.slice(5);

  return mmddA.localeCompare(mmddB);
}

function compareDates(dateA: string | null, dateB: string | null): number {
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1; // Nulls last
  if (!dateB) return -1;

  return new Date(dateA).getTime() - new Date(dateB).getTime();
}
