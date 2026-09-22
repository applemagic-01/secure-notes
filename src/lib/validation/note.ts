import { z } from "zod";

export const createNoteSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters"),

    content: z
        .string()
        .min(1, "Content is required")
        .max(100000, "Content must be at most 100,000 characters"),
});

export const updateNoteSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required")
            .max(200, "Title must be at most 200 characters")
            .optional(),

        content: z
            .string()
            .min(1, "Content is required")
            .max(100000, "Content must be at most 100,000 characters")
            .optional(),
    })
    .refine(
        (data) => data.title !== undefined || data.content !== undefined,
        {
            message: "At least one field must be provided",
        },
    );