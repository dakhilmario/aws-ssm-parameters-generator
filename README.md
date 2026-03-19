# env-to-ssm

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![AWS SSM](https://img.shields.io/badge/AWS-SSM-orange?logo=amazon-aws)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

A CLI tool to push `.env` variables to AWS SSM Parameter Store as `SecureString` parameters — with support for multiple AWS accounts via named profiles.

## Parameter naming convention

Keys are lowercased automatically:

```
ADMIN_EMAIL=admin@example.com  →  /my-backend/dev/admin_email
DB_PASSWORD=supersecret        →  /my-backend/dev/db_password
```

Full pattern: `/{service}/{env}/{key}`

## Setup

```bash
npm install
npm run build
```

## AWS Credentials Setup

The tool uses named AWS CLI profiles — one per account. Set them up in `~/.aws/credentials`:

```ini
[dev]
aws_access_key_id     = AKIA...
aws_secret_access_key = ...

[staging]
aws_access_key_id     = AKIA...
aws_secret_access_key = ...

[prod]
aws_access_key_id     = AKIA...
aws_secret_access_key = ...
```

> ⚠️ Never commit real credentials. The `~/.aws/credentials` file lives only on your machine.

## Usage

### Option 1: npm scripts (quickest)

First, update the `--service` name in each script inside `package.json` to match your service:

```json
"push:dev":     "npx tsx src/index.ts --service MY-SERVICE --env dev ...",
"push:staging": "npx tsx src/index.ts --service MY-SERVICE --env staging ...",
"push:prod":    "npx tsx src/index.ts --service MY-SERVICE --env prod ..."
```

Then just run:

```bash
npm run push:dev
npm run push:staging
npm run push:prod
```

### Option 2: run directly with tsx (full control)

Copy and adjust as needed — **remember to replace `MY-SERVICE` with your actual service name**:

```bash
# Dev
npx tsx src/index.ts --service MY-SERVICE --env dev --file .env --profile dev

# Staging
npx tsx src/index.ts --service MY-SERVICE --env staging --file .env.staging --profile staging

# Prod
npx tsx src/index.ts --service MY-SERVICE --env prod --file .env.prod --profile prod --overwrite
```

> 💡 Always do a dry run first by adding `--dry-run` to preview what will be pushed without making any changes.

## Example output

```
📄 Reading env file: /project/.env
🔧 Service:          my-backend
🌍 Environment:      dev
🌐 AWS Region:       us-east-1
👤 AWS Profile:      dev
🔐 Type:             SecureString
────────────────────────────────────────────────────────────
✅ Found 4 variables in env file

  ✅ Pushed   → /my-backend/dev/admin_email
  ✅ Pushed   → /my-backend/dev/db_host
  ⏭️  Skipped  → /my-backend/dev/db_password (already exists, use --overwrite to update)
  ✅ Pushed   → /my-backend/dev/api_key

────────────────────────────────────────────────────────────
📊 Summary:
   ✅ Pushed:   3
   ⏭️  Skipped:  1
   ❌ Failed:   0
────────────────────────────────────────────────────────────
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --service` | Service name (e.g. `my-backend`) | required |
| `-e, --env` | Environment (e.g. `dev`, `staging`, `prod`) | required |
| `-f, --file` | Path to `.env` file | `.env` |
| `-p, --profile` | AWS credentials profile | AWS default |
| `-r, --region` | AWS region | `us-east-1` |
| `--dry-run` | Preview without pushing | `false` |
| `--overwrite` | Overwrite existing parameters | `false` |
| `--kms-key` | Custom KMS key ID or ARN | AWS default |

## Required IAM permissions

```json
{
  "Effect": "Allow",
  "Action": ["ssm:PutParameter"],
  "Resource": "arn:aws:ssm:*:*:parameter/{service}/*"
}
```

## License

[MIT](./LICENSE)
