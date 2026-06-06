import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(
  request: Request,
  { params }: { params: { appId: string; modelName: string } }
) {
  try {
    const { appId, modelName } = await params;
    
    // 1. Parse the incoming payload safely
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    // 2. Fetch the master App Configuration
    const app = await prisma.app.findUnique({
      where: { id: appId },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // 3. Dynamic Schema Validation
    // We cast the JSON to our expected structure to find the specific model rules
    const config = app.config as any; 
    const modelSchema = config.dataModels?.find((m: any) => m.name === modelName);

    if (!modelSchema) {
      return NextResponse.json(
        { error: `The model '${modelName}' does not exist in this app's configuration.` }, 
        { status: 400 }
      );
    }

    // 4. Strict Field Checking (The Edge Case Handler)
    const validationErrors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const field of modelSchema.fields) {
      const value = body[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null)) {
        validationErrors.push(`Missing required field: ${field.name}`);
        continue;
      }

      // If it exists, add it to our sanitized object (drops unknown/malicious fields)
      if (value !== undefined) {
        // (Optional: You can add strict typeof checks here based on field.type)
        sanitizedData[field.name] = value;
      }
    }

    // Fail gracefully if the user's data doesn't match the AI's schema
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation Failed", details: validationErrors }, 
        { status: 400 }
      );
    }

    // 5. Execute the insertion into the JSONB column
    const record = await prisma.dataRecord.create({
      data: {
        appId,
        modelName,
        data: sanitizedData, // Only valid data gets saved
      },
    });

    return NextResponse.json({ success: true, record }, { status: 201 });

  } catch (error) {
    console.error("Dynamic API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { appId: string; modelName: string } }
) {
  try {
    const { appId, modelName } = params;

    // Fetch the records for this specific app and model
    const records = await prisma.dataRecord.findMany({
      where: {
        appId,
        modelName,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map over the records to return just the dynamic data payload alongside the ID
    const formattedRecords = records.map((record: any) => ({
      id: record.id,
      ...((record.data as Record<string, unknown>) || {})
    }));

    return NextResponse.json({ success: true, data: formattedRecords }, { status: 200 });

  } catch (error) {
    console.error("Dynamic API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}