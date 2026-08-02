"use server";

import { revalidatePath } from "next/cache";
import {
  registerForTournament,
  type RegisterInput,
} from "@/lib/tournament-store";

export async function submitRegistration(input: RegisterInput) {
  const result = await registerForTournament(input);
  if (result.ok) {
    revalidatePath("/tournaments");
    revalidatePath(`/tournaments/${input.tournamentId}`);
  }
  return result;
}
