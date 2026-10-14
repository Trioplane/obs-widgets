import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  STATUSBADGES_URL: { public: true }
})