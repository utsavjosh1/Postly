import { Resend } from "resend";
import { RESEND_API_KEY } from "../config/secrets.js";

export const resend = new Resend(RESEND_API_KEY);
