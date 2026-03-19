import * as fs from "fs";
import * as dotenv from "dotenv";

/**
 * Parses a .env file and returns a key-value map.
 * Keys are kept as-is (uppercase). Comments and empty lines are ignored.
 */
export function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const result = dotenv.config({ path: filePath, override: true });

  if (result.error) {
    console.error(`❌ Failed to parse .env file: ${result.error.message}`);
    process.exit(1);
  }

  const parsed = result.parsed ?? {};
  const count = Object.keys(parsed).length;
  console.log(`✅ Found ${count} variable${count !== 1 ? "s" : ""} in env file\n`);

  return parsed;
}
