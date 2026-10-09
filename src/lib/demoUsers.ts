import type { Role, User } from "./types";

export const DEMO_USERS: User[] = [
  {
    id: "u-farmer-demo",
    name: "K. Murugan",
    role: "farmer",
    talukId: "dharmapuri",
    subtitle: "Dharmapuri · 4.5 acres",
  },
  {
    id: "u-bank-demo",
    name: "R. Subramanian",
    role: "bank",
    talukId: "salem",
    subtitle: "Canara Bank · Salem circle",
  },
  {
    id: "u-gov-demo",
    name: "Dr. K. Ilango",
    role: "government",
    subtitle: "Groundwater Division, GoTN",
  },
  {
    id: "u-farmer-selvam",
    name: "P. Selvam",
    role: "farmer",
    talukId: "dharmapuri",
    subtitle: "Dharmapuri · 6.0 acres",
  },
  {
    id: "u-farmer-meenakshi",
    name: "A. Meenakshi",
    role: "farmer",
    talukId: "madurai",
    subtitle: "Madurai · 3.8 acres",
  },
  {
    id: "u-farmer-karthik",
    name: "R. Karthik",
    role: "farmer",
    talukId: "thanjavur",
    subtitle: "Thanjavur · 10 acres",
  },
  {
    id: "u-bank-nandini",
    name: "P. Nandini",
    role: "bank",
    talukId: "madurai",
    subtitle: "SBI · Madurai circle",
  },
];

export const ROLE_BLURB: Record<Role, string> = {
  farmer: "See your well's outlook, switch to low-water crops and claim subsidies before the well runs dry.",
  bank: "Gate crop loans by taluk risk and redirect credit to water-smart farming.",
  government: "See the full state picture, rank at-risk taluks and allocate resources 30–90 days early.",
};

export function dashboardFor(role: Role): string {
  return role === "farmer" ? "/farmer" : role === "bank" ? "/bank" : "/government";
}
