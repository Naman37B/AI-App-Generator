import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Pool } from "@/node_modules/@types/pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const app = await prisma.app.create({
      data: {
        name: body.appName || "Untitled App",
        config: body,
      },
    });

    return NextResponse.json({ success: true, appId: app.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create app" }, { status: 500 });
  }
}