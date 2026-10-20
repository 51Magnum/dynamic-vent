import replyTime from "./reply-time.json";
import quoteTemplate from "./quote-confirmation.json";

export const quoteConfirmation = quoteTemplate.replace(
  "{replyTime}",
  replyTime,
);
export const generalConfirmation = `Thank you. Your inquiry has been sent to DynamicVent. We’ll reply by email ${replyTime} to confirm pricing and next steps.`;
