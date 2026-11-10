import { redirect } from "next/navigation";

/** Handoff now lives in each number's routing. Old links land on Phone numbers. */
export default function Page() {
  redirect("/phone");
}
