import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";

/** Accepts either the top-level PrismaService or a `$transaction` callback's
 * tx client — lets a service's read/write methods run standalone or as part
 * of a caller's larger atomic transaction (e.g. checkout). */
export type PrismaTx = PrismaService | Prisma.TransactionClient;
