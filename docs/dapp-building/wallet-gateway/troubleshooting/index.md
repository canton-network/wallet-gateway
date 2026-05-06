# Troubleshooting

This section covers common issues and their solutions when working with the Wallet Gateway.

## Common Issues

## Database Connection Errors

**Problem:** The Gateway fails to start with database connection errors.

**Solutions:**

1. **PostgreSQL:**
    - Verify the database exists: `psql -U postgres -l`
    - Check connection credentials in your config file
    - Ensure PostgreSQL is running: `pg_isready`
    - Verify network connectivity and firewall rules

2. **SQLite:**
    - Ensure the directory exists for the database file
    - Check file permissions (read/write access required)
    - Verify disk space is available

3. **Memory Store:**
    - No configuration needed, but remember: data is lost on restart

## Authentication Failures

**Problem:** API calls return 401 Unauthorized errors.

**Solutions:**

1. **Invalid or Expired Token:**
    - Ensure you're using a valid JWT token
    - Check token expiration time
    - Regenerate the token if necessary

2. **Missing Authorization Header:**
    - Include the Authorization header: `Authorization: Bearer <token>`
    - Verify the header format is correct

3. **Session Not Found:**
    - Create a session using `addSession()` method first
    - Ensure the session hasn't expired
    - Check that you're using the correct user context

## Network Connection Issues

**Problem:** Cannot connect to configured networks or ledger API.

**Solutions:**

1. **Network Unreachable:**
    - Verify the ledger API URL is correct in your network configuration
    - Test connectivity: `curl <ledger-api-url>/v2/version`
    - Check firewall rules and network routing

2. **Invalid Network Configuration:**
    - Verify the `synchronizerId` matches the validator configuration
    - Ensure the identity provider ID matches between network and IDP configs
    - Check that authentication credentials are correct

3. **SSL/TLS Issues:**
    - For HTTPS endpoints, verify certificates are valid
    - In development, you may need to use HTTP or configure certificate trust

## Port Already in Use

**Problem:** Error: `EADDRINUSE: address already in use :::3030`

**Solutions:**

1. Find and stop the process using the port:

    ```bash
    # macOS/Linux
    lsof -ti:3030 | xargs kill -9

    # Or find the process
    lsof -i :3030
    ```

2. Use a different port:

    ```bash
    wallet-gateway -c ./config.json -p 8080
    ```

3. Check if another Gateway instance is running:

    ```bash
    ps aux | grep wallet-gateway
    ```

## Configuration Validation Errors

**Problem:** Gateway fails to start with configuration errors.

**Solutions:**

1. **Validate your config against the schema:**

    ```bash
    wallet-gateway --config-schema > schema.json
    # Use a JSON schema validator tool
    ```

2. **Check for common mistakes:**
    - Missing required fields
    - Invalid JSON syntax
    - Type mismatches (strings vs numbers)
    - Missing or incorrect IDP references in network configs

3. **Use the example config as a template:**

    ```bash
    wallet-gateway --config-example > my-config.json
    # Edit my-config.json
    ```

## Signing Provider Issues

**Problem:** Transactions fail with signing errors.

**Solutions:**

1. **Fireblocks:**
    - Verify environment variables are set correctly: `FIREBLOCKS_SECRET` and `FIREBLOCKS_API_KEY`
    - Ensure API keys are valid and have proper permissions
    - Verify Fireblocks API is accessible from your network

2. **Participant:**
    - Ensure the participant node is running and accessible
    - Verify the party exists on the participant
    - Check participant logs for signing errors

3. **Blockdaemon:**
    - Verify environment variables are set: `BLOCKDAEMON_API_URL` and `BLOCKDAEMON_API_KEY`
    - Test API connectivity
    - Ensure API key has signing permissions

4. **Dfns:**
    - Verify environment variables are set: `DFNS_ORG_ID`, `DFNS_BASE_URL`, `DFNS_CRED_ID`, `DFNS_PRIVATE_KEY`, and `DFNS_AUTH_TOKEN`
    - Ensure the service account credentials are correct
    - Confirm the service account has wallet creation and signing permissions

## Debugging

## Enable Debug Logging

Set log level to debug for more detailed information:

```bash
wallet-gateway -c ./config.json -f pretty
# Logs will show debug-level information
```

For structured logging (useful for log aggregation):

```bash
wallet-gateway -c ./config.json -f json
```

## Check Logs

Review the Gateway logs for error messages and stack traces. Common log locations:

- Console output (when running directly)
- System logs (when running as a service)
- Container logs (when running in Docker/Kubernetes)

## Verify API Endpoints

Test that the Gateway is responding:

```bash
# Health check (web UI)
curl http://localhost:3030

# dApp API status (requires authentication)
curl -X POST http://localhost:3030/api/v0/dapp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"status","params":[]}'
```

## Getting Help

If you continue to experience issues:

1. Check the logs for detailed error messages
2. Verify your configuration against the schema
3. Review the API specifications for correct usage
4. Check GitHub issues for similar problems
5. Review the configuration documentation for your specific setup

## Log Levels

The Gateway uses structured logging with the following levels:

- **ERROR**: Critical errors that prevent operation
- **WARN**: Warning conditions that may cause issues
- **INFO**: Informational messages about normal operation
- **DEBUG**: Detailed diagnostic information

Adjust log verbosity based on your needs. In production, INFO level is typically sufficient, while DEBUG is useful for troubleshooting.
