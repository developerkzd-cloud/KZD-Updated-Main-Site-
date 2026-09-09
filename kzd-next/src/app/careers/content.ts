/* Editorial copy for the careers page. These four cards and four steps are
   hand-written marketing text, not job data, so they live beside the page
   rather than in careers.json — nothing in the CMS would own them. */

export const WHY_CARDS = [
  {
    title: "Real work, week one",
    body: "You will be on live client projects, not shadowing. Junior does not mean sidelined.",
  },
  {
    title: "Someone senior on hand",
    body: "Every role reports to someone who reviews your work and explains the why, not just the what.",
  },
  {
    title: "Learn the whole stack",
    body: "Design, build, deploy, support. Small team means you see a project end to end.",
  },
  {
    title: "Built in Durban",
    body: "We are local, we hire local, and the work stays here.",
  },
] as const;

export const HIRING_STEPS = [
  { title: "Apply", body: "Create an account and submit your details. Takes about ten minutes." },
  { title: "Confirmation", body: "You get an email confirming we have your application." },
  {
    title: "We review",
    body: "Give us 30 days. If you have not heard from us by then, your application was not successful this time.",
  },
  { title: "Interview", body: "If you are shortlisted we contact you with a date and time." },
] as const;
