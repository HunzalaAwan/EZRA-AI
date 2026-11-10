import type { Route } from "next";
import {
  AddressBookIcon,
  BooksIcon,
  ChatTextIcon,
  ChatsCircleIcon,
  CreditCardIcon,
  GearSixIcon,
  HouseIcon,
  PhoneIcon,
  PlugsConnectedIcon,
  RobotIcon,
  type Icon,
} from "@phosphor-icons/react";

export interface NavItem {
  href: Route;
  label: string;
  icon: Icon;
  /** Shown as a count on the rail. Only for things that need a human. */
  badgeKey?: "needsReview";
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: HouseIcon },
  { href: "/agents", label: "Agents", icon: RobotIcon },
  { href: "/knowledge", label: "Knowledge", icon: BooksIcon },
  {
    href: "/conversations",
    label: "Conversations",
    icon: ChatsCircleIcon,
    badgeKey: "needsReview",
  },
  { href: "/contacts", label: "Contacts", icon: AddressBookIcon },
  { href: "/messages", label: "Messages", icon: ChatTextIcon },
  { href: "/phone", label: "Phone numbers", icon: PhoneIcon },
  { href: "/integrations", label: "Integrations", icon: PlugsConnectedIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/billing", label: "Plan and usage", icon: CreditCardIcon },
  { href: "/settings", label: "Settings", icon: GearSixIcon },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];
