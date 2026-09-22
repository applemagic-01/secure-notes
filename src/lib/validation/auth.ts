import { z } from "zod";

// Registration validation runs on the server so the API cannot be bypassed by a custom client.\nexport const registerSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
});

// Login still validates the request shape before we query the database.\nexport const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password must be at most 128 characters"),
});