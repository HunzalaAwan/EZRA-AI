import { redirect } from "next/navigation";

/** Moved to /phone. Old links land there. */
export default function Page() {
  redirect("/phone");
}
