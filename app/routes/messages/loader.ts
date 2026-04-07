import { redirect } from "react-router";
import type { Route } from "./+types/index";

export async function loader(_args: Route.LoaderArgs) {
  // Messages index redirects to the last opened message thread.
  // In a real implementation, we would look up the user's last thread.
  throw redirect("/messages/2");
}
