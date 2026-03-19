#!/usr/bin/env node

import { Command } from "commander";
import { pushEnvToSSM } from "./ssm";
import { parseEnvFile } from "./parser";
import * as path from "path";

const program = new Command();

program
  .name("env-to-ssm")
  .description("Push .env variables to AWS SSM Parameter Store")
  .requiredOption("-s, --service <name>", "Service name (e.g. my-backend)")
  .requiredOption(
    "-e, --env <environment>",
    "Environment (e.g. dev, staging, prod)",
  )
  .requiredOption("-f, --file <path>", "Path to .env file", ".env")
  .option("-r, --region <region>", "AWS region", "eu-central-1")
  .option(
    "-p, --profile <profile>",
    "AWS credentials profile (from ~/.aws/credentials)",
  )
  .option("--dry-run", "Preview parameters without pushing to SSM", false)
  .option("--overwrite", "Overwrite existing SSM parameters", false)
  .option(
    "--kms-key <keyId>",
    "Custom KMS key ID or ARN (uses AWS default if omitted)",
  )
  .action(async (options) => {
    const envFilePath = path.resolve(process.cwd(), options.file);

    console.log(`\n📄 Reading env file: ${envFilePath}`);
    console.log(`🔧 Service:          ${options.service}`);
    console.log(`🌍 Environment:      ${options.env}`);
    console.log(`🌐 AWS Region:       ${options.region}`);
    console.log(`👤 AWS Profile:      ${options.profile ?? "default"}`);
    console.log(`🔐 Type:             SecureString`);
    if (options.kmsKey) {
      console.log(`🗝️  KMS Key:          ${options.kmsKey}`);
    }
    if (options.dryRun) {
      console.log(`\n⚠️  DRY RUN MODE — no changes will be made to SSM\n`);
    }
    console.log("─".repeat(60));

    const variables = parseEnvFile(envFilePath);

    if (Object.keys(variables).length === 0) {
      console.error("❌ No variables found in env file. Exiting.");
      process.exit(1);
    }

    await pushEnvToSSM({
      variables,
      service: options.service.toLowerCase(),
      environment: options.env.toLowerCase(),
      region: options.region,
      profile: options.profile,
      dryRun: options.dryRun,
      overwrite: options.overwrite,
      kmsKeyId: options.kmsKey,
    });
  });

program.parse(process.argv);
