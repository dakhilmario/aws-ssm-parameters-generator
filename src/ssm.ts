import {
  SSMClient,
  PutParameterCommand,
  PutParameterCommandInput,
  ParameterAlreadyExists,
} from "@aws-sdk/client-ssm";
import { fromIni } from "@aws-sdk/credential-providers";

interface PushOptions {
  variables: Record<string, string>;
  service: string;
  environment: string;
  region: string;
  profile?: string;
  dryRun: boolean;
  overwrite: boolean;
  kmsKeyId?: string;
}

interface PushResult {
  succeeded: string[];
  skipped: string[];
  failed: string[];
}

/**
 * Converts an env key to its SSM parameter name.
 * Example: ADMIN_EMAIL → /eva-backend/dev/admin_email
 */
function toParameterName(service: string, environment: string, key: string): string {
  return `/${service}/${environment}/${key.toLowerCase()}`;
}

export async function pushEnvToSSM(options: PushOptions): Promise<void> {
  const { variables, service, environment, region, profile, dryRun, overwrite, kmsKeyId } = options;

  const client = new SSMClient({
    region,
    ...(profile ? { credentials: fromIni({ profile }) } : {}),
  });
  const result: PushResult = { succeeded: [], skipped: [], failed: [] };

  const entries = Object.entries(variables);

  for (const [key, value] of entries) {
    const paramName = toParameterName(service, environment, key);

    if (dryRun) {
      console.log(`  [dry-run] Would push → ${paramName}`);
      result.succeeded.push(paramName);
      continue;
    }

    const input: PutParameterCommandInput = {
      Name: paramName,
      Value: value,
      Type: "SecureString",
      Overwrite: overwrite,
      ...(kmsKeyId ? { KeyId: kmsKeyId } : {}),
    };

    try {
      await client.send(new PutParameterCommand(input));
      console.log(`  ✅ Pushed   → ${paramName}`);
      result.succeeded.push(paramName);
    } catch (err) {
      if (err instanceof ParameterAlreadyExists) {
        console.log(`  ⏭️  Skipped  → ${paramName} (already exists, use --overwrite to update)`);
        result.skipped.push(paramName);
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Failed   → ${paramName}: ${message}`);
        result.failed.push(paramName);
      }
    }
  }

  printSummary(result, dryRun);

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

function printSummary(result: PushResult, dryRun: boolean): void {
  console.log("\n" + "─".repeat(60));
  console.log("📊 Summary:");
  if (dryRun) {
    console.log(`   Would push: ${result.succeeded.length} parameter(s)`);
  } else {
    console.log(`   ✅ Pushed:   ${result.succeeded.length}`);
    console.log(`   ⏭️  Skipped:  ${result.skipped.length}`);
    console.log(`   ❌ Failed:   ${result.failed.length}`);
  }
  console.log("─".repeat(60) + "\n");
}