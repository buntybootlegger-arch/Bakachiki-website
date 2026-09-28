import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

function makeService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const jwt = {
    sign: jest.fn().mockReturnValue("signed.jwt.token"),
    verify: jest.fn(),
  };
  const config = {
    getOrThrow: jest.fn((key: string) => `secret-${key}`),
    get: jest.fn((key: string) => (key === "WEB_URL" ? "http://localhost:3000" : undefined)),
  };

  const service = new AuthService(prisma as any, jwt as any, config as any);
  return { service, prisma, jwt, config };
}

describe("AuthService", () => {
  it("registers a new user with a hashed password and issues tokens", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "user-1", email: "jane@example.com" });
    prisma.user.update.mockResolvedValue({});

    const result = await service.register({
      email: "jane@example.com",
      password: "Sup3rSecret!",
    } as any);

    expect(result.accessToken).toBe("signed.jwt.token");
    expect(prisma.user.create).toHaveBeenCalled();
    const createArgs = prisma.user.create.mock.calls[0][0];
    expect(createArgs.data.passwordHash).not.toBe("Sup3rSecret!");
    expect(await bcrypt.compare("Sup3rSecret!", createArgs.data.passwordHash)).toBe(true);
  });

  it("rejects registration when the email is already taken", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });

    await expect(
      service.register({ email: "jane@example.com", password: "Sup3rSecret!" } as any),
    ).rejects.toThrow(ConflictException);
  });

  it("rejects login with an incorrect password", async () => {
    const { service, prisma } = makeService();
    const passwordHash = await bcrypt.hash("correct-password", 10);
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "jane@example.com",
      passwordHash,
      isActive: true,
    });

    await expect(
      service.login({ email: "jane@example.com", password: "wrong-password" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rejects login for a disabled account", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "jane@example.com",
      passwordHash: await bcrypt.hash("correct-password", 10),
      isActive: false,
    });

    await expect(
      service.login({ email: "jane@example.com", password: "correct-password" }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("accepts login with the correct password and issues tokens", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "jane@example.com",
      passwordHash: await bcrypt.hash("correct-password", 10),
      isActive: true,
    });
    prisma.user.update.mockResolvedValue({});

    const result = await service.login({ email: "jane@example.com", password: "correct-password" });
    expect(result.accessToken).toBe("signed.jwt.token");
  });
});
