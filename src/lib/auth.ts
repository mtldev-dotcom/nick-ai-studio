import { prisma } from "@/lib/prisma";

export async function createOrGetUser(clerkUserId: string, email: string) {
  let user = await prisma.user.findUnique({
    where: { id: clerkUserId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: clerkUserId,
        email,
      },
    });
  }

  return user;
}
