import zod from "zod";
import userService from "~/server/services/userService";
import { DefaultCookie } from "~/server/services/authService";

const validateRegisterUser = zod.object({
  email: zod.string().email({ message: "Email must be a valid email address" }).min(1, { message: "Email is required" }),
  password: zod.string().min(8, { message: "Password must be at least 8 characters long" })
});

export default defineEventHandler(async (event) => {
  try {

    const body = await readValidatedBody(event, validateRegisterUser.parse);
    const user = await userService.RegisterUser(body.email, body.password);

    setCookie(event, "access-token", user.access_token, DefaultCookie(15 * 60 * 1000));
    setCookie(event, "refresh-token", user.refresh_token, DefaultCookie(7 * 24 * 60 * 60 * 1000));

    return {
      statusCode: 201,
      body: user,
    };
  } catch (error) {
    if (error instanceof zod.ZodError) {
      console.error("Validation error:", error.errors);
      const validationErrors = error.errors.map((err) => err.message).join(", ");
      createError({ statusCode: 400, statusMessage: validationErrors });
    } else if (error instanceof Error) {
      console.error("Unexpected error:", error);
      createError({ statusCode: 401, statusMessage: "An error occured. Please Try Again Later." });
    } else {
      console.error("Unexpected error:", error);
      return createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
  }
});
