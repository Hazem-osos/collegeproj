import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireInstructorScoped } from "@/lib/api-helpers";

const patchSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().min(1).max(1000).optional(),
  officeLocation: z.string().min(1).max(255).optional(),
});

async function instructorProfileJson(instructorId: number) {
  const inst = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: { select: { id: true, bio: true, officeLocation: true } },
    },
  });
  if (!inst) return null;
  return {
    id: inst.id,
    fullName: inst.fullName,
    email: inst.email,
    profile: inst.profile
      ? {
          id: inst.profile.id,
          bio: inst.profile.bio,
          officeLocation: inst.profile.officeLocation,
        }
      : null,
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

  const body = await instructorProfileJson(scoped.instructorId);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(body);
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;
  const scoped = await requireInstructorScoped(auth.user);
  if (scoped instanceof NextResponse) return scoped;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  if (
    parsed.data.fullName === undefined &&
    parsed.data.bio === undefined &&
    parsed.data.officeLocation === undefined
  ) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const iid = scoped.instructorId;
  const { fullName, bio, officeLocation } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      if (fullName !== undefined) {
        await tx.instructor.update({
          where: { id: iid },
          data: { fullName: fullName.trim() },
        });
      }

      const wantProfile = bio !== undefined || officeLocation !== undefined;
      if (!wantProfile) return;

      const existing = await tx.instructorProfile.findUnique({
        where: { instructorId: iid },
      });
      if (!existing) {
        if (bio === undefined || officeLocation === undefined) {
          throw new Error("FIRST_PROFILE_NEEDS_BOTH");
        }
        await tx.instructorProfile.create({
          data: {
            instructorId: iid,
            bio: bio.trim(),
            officeLocation: officeLocation.trim(),
          },
        });
        return;
      }

      await tx.instructorProfile.update({
        where: { instructorId: iid },
        data: {
          ...(bio !== undefined ? { bio: bio.trim() } : {}),
          ...(officeLocation !== undefined ? { officeLocation: officeLocation.trim() } : {}),
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FIRST_PROFILE_NEEDS_BOTH") {
      return NextResponse.json(
        {
          error:
            "To create your first office profile on this account, supply both bio and officeLocation.",
        },
        { status: 400 },
      );
    }
    throw e;
  }

  const body = await instructorProfileJson(iid);
  if (!body) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(body);
}
