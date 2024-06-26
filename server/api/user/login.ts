import zod from "zod";
import { DefaultCookie } from "~/server/services/authService";
import userService from "~/server/services/userService";
import { H3Error } from "h3";

const validateUserLogIn = zod.object({
  email: zod.string().email("Email must be a valid email address"),
  password: zod.string().min(8, "Password must be at least 8 characters long"),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readValidatedBody(event, validateUserLogIn.parse);
    const user = await userService.LogInUser(body.email, body.password);

    setCookie(event, "access-token", user.access_token, DefaultCookie(15 * 60 * 1000));
    setCookie(event, "refresh-token", user.refresh_token, DefaultCookie(7 * 24 * 60 * 60 * 1000));

    return {
      statusCode: 200,
      user: user,
    };
  } catch (error) {
    if (error instanceof H3Error) {
      console.error("Validation error:", error.data);
      throw createError({ statusCode: 400, statusMessage: error.statusMessage });
    } else if (error instanceof Error) {
      console.error("Unexpected error:", error);
      throw createError({ statusCode: 401, statusMessage: "Invalid Email or Password. Please Try Again." });
    } else {
      console.error("Unexpected error:", error);
      throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
  }
});
